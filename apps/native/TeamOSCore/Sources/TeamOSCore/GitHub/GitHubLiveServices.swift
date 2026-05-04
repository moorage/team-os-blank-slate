import Foundation

private struct GitHubRepositoryResponse: Decodable {
    struct Permissions: Decodable {
        let admin: Bool?
        let pull: Bool?
        let push: Bool?
    }

    let default_branch: String
    let permissions: Permissions?
}

private struct GitHubRefResponse: Decodable {
    struct ObjectRef: Decodable {
        let sha: String
    }

    let object: ObjectRef
}

private struct GitHubContentResponse: Decodable {
    let sha: String
}

private struct GitHubPullRequestResponse: Decodable {
    struct HeadRef: Decodable {
        let ref: String
    }

    let number: Int
    let html_url: String
    let draft: Bool
    let head: HeadRef
}

private struct GitHubCreateRefRequest: Encodable {
    let ref: String
    let sha: String
}

private struct GitHubPutFileRequest: Encodable {
    let message: String
    let content: String
    let branch: String
    let sha: String?
}

private struct GitHubDeleteFileRequest: Encodable {
    let message: String
    let branch: String
    let sha: String
}

private struct GitHubCreatePullRequestRequest: Encodable {
    let title: String
    let body: String
    let head: String
    let base: String
    let draft: Bool
}

private struct GitHubUpdatePullRequestRequest: Encodable {
    let title: String
    let body: String
}

public struct LiveGitHubService: GitHubAuthenticating, GitHubRepositoryChecking, GitHubBranchWriting, GitHubPullRequestManaging {
    private let client: GitHubRESTClient

    public init(client: GitHubRESTClient) {
        self.client = client
    }

    public func authenticate() async throws -> GitHubViewer {
        try await client.get(pathComponents: ["user"])
    }

    public func accessContext(for repository: RepoDescriptor) async throws -> RepoAccessContext {
        _ = try await authenticate()

        let repoResponse: GitHubRepositoryResponse
        do {
            repoResponse = try await client.get(pathComponents: ["repos", repository.owner, repository.name])
        } catch let error as GitHubServiceError {
            if case .repositoryNotFound = error {
                return RepoAccessContext(
                    repository: repository,
                    isAuthenticated: true,
                    repositoryExists: false,
                    permissions: RepoPermissionSet(
                        canRead: false,
                        canWriteContents: false,
                        canWriteBranches: false,
                        canWritePullRequests: false
                    ),
                    presentMarkers: []
                )
            }
            throw error
        }

        let canPull = repoResponse.permissions?.pull ?? false
        let canPush = repoResponse.permissions?.push ?? false
        let canAdmin = repoResponse.permissions?.admin ?? false
        let permissions = RepoPermissionSet(
            canRead: canPull || canPush || canAdmin,
            canWriteContents: canPush || canAdmin,
            canWriteBranches: canPush || canAdmin,
            canWritePullRequests: canPush || canAdmin
        )

        let markers = try await existingMarkers(in: repository)
        return RepoAccessContext(
            repository: RepoDescriptor(owner: repository.owner, name: repository.name, defaultBranch: repoResponse.default_branch),
            isAuthenticated: true,
            repositoryExists: true,
            permissions: permissions,
            presentMarkers: markers
        )
    }

    public func ensureBranch(for repository: RepoDescriptor, session: BranchSession) async throws -> BranchSession {
        let branchPath = ["repos", repository.owner, repository.name, "git", "ref", "heads", session.branchName]
        let existingRef = try await client.send(method: "GET", pathComponents: branchPath)
        if existingRef.statusCode == 200 {
            return session
        }
        if existingRef.statusCode != 404 {
            throw client.mapError(existingRef)
        }

        let baseRef: GitHubRefResponse = try await client.get(
            pathComponents: ["repos", repository.owner, repository.name, "git", "ref", "heads", session.baseBranch]
        )
        let body = try client.encodedBody(
            GitHubCreateRefRequest(ref: "refs/heads/\(session.branchName)", sha: baseRef.object.sha)
        )
        let createResponse = try await client.send(
            method: "POST",
            pathComponents: ["repos", repository.owner, repository.name, "git", "refs"],
            body: body
        )
        guard (200..<300).contains(createResponse.statusCode) else {
            throw client.mapError(createResponse)
        }
        return session
    }

    public func apply(plan: MutationPlan, in repository: RepoDescriptor, on branch: BranchSession) async throws -> GitHubAppliedMutation {
        let ensuredBranch = try await ensureBranch(for: repository, session: branch)
        var committedPaths: [String] = []

        for fileWrite in plan.fileWrites {
            switch fileWrite.mode {
            case .upsert:
                guard let contents = fileWrite.contents else {
                    throw GitHubServiceError.missingFileContents(fileWrite.path)
                }
                let remoteSHA = try await resolveRemoteSHA(
                    for: repository,
                    branch: ensuredBranch.branchName,
                    path: fileWrite.path,
                    preferredSHA: fileWrite.expectedRemoteSHA
                )
                let body = try client.encodedBody(
                    GitHubPutFileRequest(
                        message: plan.commitMessage,
                        content: Data(contents.utf8).base64EncodedString(),
                        branch: ensuredBranch.branchName,
                        sha: remoteSHA
                    )
                )
                let response = try await client.send(
                    method: "PUT",
                    pathComponents: ["repos", repository.owner, repository.name, "contents", fileWrite.path],
                    body: body
                )
                guard (200..<300).contains(response.statusCode) else {
                    throw client.mapError(response)
                }
            case .delete:
                let remoteSHA = try await resolveRemoteSHA(
                    for: repository,
                    branch: ensuredBranch.branchName,
                    path: fileWrite.path,
                    preferredSHA: fileWrite.expectedRemoteSHA
                )
                guard let remoteSHA else {
                    throw GitHubServiceError.requestFailed(status: 404, message: "Cannot delete missing file \(fileWrite.path).")
                }
                let body = try client.encodedBody(
                    GitHubDeleteFileRequest(
                        message: plan.commitMessage,
                        branch: ensuredBranch.branchName,
                        sha: remoteSHA
                    )
                )
                let response = try await client.send(
                    method: "DELETE",
                    pathComponents: ["repos", repository.owner, repository.name, "contents", fileWrite.path],
                    body: body
                )
                guard (200..<300).contains(response.statusCode) else {
                    throw client.mapError(response)
                }
            }

            committedPaths.append(fileWrite.path)
        }

        return GitHubAppliedMutation(branchName: ensuredBranch.branchName, committedPaths: committedPaths)
    }

    public func upsertPullRequest(
        for repository: RepoDescriptor,
        branch: BranchSession,
        plan: MutationPlan
    ) async throws -> PullRequestState {
        let openPullsResponse = try await client.send(
            method: "GET",
            pathComponents: ["repos", repository.owner, repository.name, "pulls"],
            query: [
                URLQueryItem(name: "head", value: "\(repository.owner):\(branch.branchName)"),
                URLQueryItem(name: "state", value: "open"),
            ]
        )
        guard (200..<300).contains(openPullsResponse.statusCode) else {
            throw client.mapError(openPullsResponse)
        }
        let decoder = JSONDecoder()
        let openPulls = try decoder.decode([GitHubPullRequestResponse].self, from: openPullsResponse.data)

        if let existing = openPulls.first {
            let updateBody = try client.encodedBody(
                GitHubUpdatePullRequestRequest(title: plan.pullRequestTitle, body: plan.pullRequestBody)
            )
            let updateResponse = try await client.send(
                method: "PATCH",
                pathComponents: ["repos", repository.owner, repository.name, "pulls", "\(existing.number)"],
                body: updateBody
            )
            guard (200..<300).contains(updateResponse.statusCode) else {
                throw client.mapError(updateResponse)
            }
            let updated = try decoder.decode(GitHubPullRequestResponse.self, from: updateResponse.data)
            return PullRequestState(number: updated.number, url: updated.html_url, isDraft: updated.draft, headBranch: updated.head.ref)
        }

        let createBody = try client.encodedBody(
            GitHubCreatePullRequestRequest(
                title: plan.pullRequestTitle,
                body: plan.pullRequestBody,
                head: branch.branchName,
                base: branch.baseBranch,
                draft: plan.draftPullRequest
            )
        )
        let createResponse = try await client.send(
            method: "POST",
            pathComponents: ["repos", repository.owner, repository.name, "pulls"],
            body: createBody
        )
        guard (200..<300).contains(createResponse.statusCode) else {
            throw client.mapError(createResponse)
        }
        let created = try decoder.decode(GitHubPullRequestResponse.self, from: createResponse.data)
        return PullRequestState(number: created.number, url: created.html_url, isDraft: created.draft, headBranch: created.head.ref)
    }

    private func existingMarkers(in repository: RepoDescriptor) async throws -> [String] {
        var markers: [String] = []
        for marker in TeamOSMarkers.requiredPaths {
            let response = try await client.send(
                method: "GET",
                pathComponents: ["repos", repository.owner, repository.name, "contents", marker]
            )
            if response.statusCode == 200 {
                markers.append(marker)
                continue
            }
            if response.statusCode == 404 {
                continue
            }
            throw client.mapError(response)
        }
        return markers
    }

    private func resolveRemoteSHA(
        for repository: RepoDescriptor,
        branch: String,
        path filePath: String,
        preferredSHA: String?
    ) async throws -> String? {
        if let preferredSHA {
            return preferredSHA
        }
        let response = try await client.send(
            method: "GET",
            pathComponents: ["repos", repository.owner, repository.name, "contents", filePath],
            query: [URLQueryItem(name: "ref", value: branch)]
        )
        if response.statusCode == 404 {
            return nil
        }
        guard (200..<300).contains(response.statusCode) else {
            throw client.mapError(response)
        }
        let content = try JSONDecoder().decode(GitHubContentResponse.self, from: response.data)
        return content.sha
    }
}
