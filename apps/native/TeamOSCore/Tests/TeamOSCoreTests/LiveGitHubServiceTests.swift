import Foundation
import XCTest

@testable import TeamOSCore

private actor MockGitHubTransport: GitHubHTTPTransport {
    struct QueuedResponse {
        let statusCode: Int
        let body: String
    }

    private var queuedResponses: [QueuedResponse]
    private var requests: [URLRequest] = []

    init(queuedResponses: [QueuedResponse]) {
        self.queuedResponses = queuedResponses
    }

    func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        requests.append(request)
        let next = queuedResponses.removeFirst()
        let data = Data(next.body.utf8)
        let response = HTTPURLResponse(url: request.url!, statusCode: next.statusCode, httpVersion: nil, headerFields: nil)!
        return (data, response)
    }

    func recordedRequests() -> [URLRequest] {
        requests
    }
}

final class LiveGitHubServiceTests: XCTestCase {
    func testAuthenticateBuildsAuthorizedUserRequest() async throws {
        let transport = MockGitHubTransport(
            queuedResponses: [
                .init(statusCode: 200, body: #"{"login":"matt","id":7}"#),
            ]
        )
        let client = GitHubRESTClient(
            configuration: GitHubServiceConfiguration(baseURL: URL(string: "https://example.com")!, userAgent: "team-os-tests"),
            tokenProvider: StaticGitHubTokenProvider(value: "secret"),
            transport: transport
        )
        let service = LiveGitHubService(client: client)

        let viewer = try await service.authenticate()
        let requests = await transport.recordedRequests()
        let request = try XCTUnwrap(requests.first)

        XCTAssertEqual(viewer, GitHubViewer(login: "matt", id: 7))
        XCTAssertEqual(request.url?.absoluteString, "https://example.com/user")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer secret")
        XCTAssertEqual(request.value(forHTTPHeaderField: "User-Agent"), "team-os-tests")
    }

    func testAccessContextEvaluatesRepoPermissionsAndMarkers() async throws {
        let transport = MockGitHubTransport(
            queuedResponses: [
                .init(statusCode: 200, body: #"{"login":"matt","id":7}"#),
                .init(statusCode: 200, body: #"{"default_branch":"main","permissions":{"pull":true,"push":true,"admin":false}}"#),
                .init(statusCode: 200, body: #"{"name":"AGENTS.md"}"#),
                .init(statusCode: 200, body: #"[]"#),
                .init(statusCode: 404, body: #"{"message":"Not Found"}"#),
                .init(statusCode: 200, body: #"[]"#),
            ]
        )
        let client = GitHubRESTClient(
            configuration: GitHubServiceConfiguration(baseURL: URL(string: "https://example.com")!),
            tokenProvider: StaticGitHubTokenProvider(value: "secret"),
            transport: transport
        )
        let service = LiveGitHubService(client: client)

        let context = try await service.accessContext(for: RepoDescriptor(owner: "team-os", name: "blank-slate"))

        XCTAssertEqual(context.repository, RepoDescriptor(owner: "team-os", name: "blank-slate", defaultBranch: "main"))
        XCTAssertTrue(context.permissions.canWriteContents)
        XCTAssertEqual(context.presentMarkers, ["AGENTS.md", "kanban/AGENTS.md", "kanban/cards"])
    }

    func testEnsureBranchCreatesMissingBranchFromBaseRef() async throws {
        let transport = MockGitHubTransport(
            queuedResponses: [
                .init(statusCode: 404, body: #"{"message":"Not Found"}"#),
                .init(statusCode: 200, body: #"{"object":{"sha":"abc123"}}"#),
                .init(statusCode: 201, body: #"{"ref":"refs/heads/teamos/matt/2026-05-04/demo"}"#),
            ]
        )
        let client = GitHubRESTClient(
            configuration: GitHubServiceConfiguration(baseURL: URL(string: "https://example.com")!),
            tokenProvider: StaticGitHubTokenProvider(value: "secret"),
            transport: transport
        )
        let service = LiveGitHubService(client: client)
        let branch = BranchSession(
            repository: RepoDescriptor(owner: "team-os", name: "blank-slate"),
            branchName: "teamos/matt/2026-05-04/demo",
            baseBranch: "main",
            createdAt: "2026-05-04T18:00:00Z"
        )

        _ = try await service.ensureBranch(for: branch.repository, session: branch)
        let requests = await transport.recordedRequests()
        let body = try XCTUnwrap(requests.last?.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: String])

        XCTAssertEqual(json["ref"], "refs/heads/teamos/matt/2026-05-04/demo")
        XCTAssertEqual(json["sha"], "abc123")
    }

    func testApplyWritesFileContentsToGitHub() async throws {
        let transport = MockGitHubTransport(
            queuedResponses: [
                .init(statusCode: 200, body: #"{"ref":"refs/heads/teamos/matt/2026-05-04/demo"}"#),
                .init(statusCode: 200, body: #"{"sha":"remote-sha"}"#),
                .init(statusCode: 200, body: #"{"content":{"sha":"new-sha"}}"#),
            ]
        )
        let client = GitHubRESTClient(
            configuration: GitHubServiceConfiguration(baseURL: URL(string: "https://example.com")!),
            tokenProvider: StaticGitHubTokenProvider(value: "secret"),
            transport: transport
        )
        let service = LiveGitHubService(client: client)
        let branch = BranchSession(
            repository: RepoDescriptor(owner: "team-os", name: "blank-slate"),
            branchName: "teamos/matt/2026-05-04/demo",
            baseBranch: "main",
            createdAt: "2026-05-04T18:00:00Z"
        )
        let plan = MutationPlan(
            kind: .addComment,
            cardID: "KAN-2026-0002",
            changedFiles: [MutationFileChange(path: "kanban/cards/KAN-2026-0002/comments/2026-05-04T18-00-00Z-matt.md", reason: "Append comment")],
            fileWrites: [PlannedFileWrite(path: "kanban/cards/KAN-2026-0002/comments/2026-05-04T18-00-00Z-matt.md", contents: "hello team os")],
            commitMessage: "Add comment\n\nAI-Model: gpt-5.4",
            pullRequestTitle: "Add comment",
            pullRequestBody: "Body"
        )

        let result = try await service.apply(plan: plan, in: branch.repository, on: branch)
        let requests = await transport.recordedRequests()
        let putRequest = try XCTUnwrap(requests.last)
        let body = try XCTUnwrap(putRequest.httpBody)
        let json = String(decoding: body, as: UTF8.self)

        XCTAssertEqual(result.committedPaths, ["kanban/cards/KAN-2026-0002/comments/2026-05-04T18-00-00Z-matt.md"])
        XCTAssertEqual(putRequest.httpMethod, "PUT")
        XCTAssertTrue(json.contains(#""sha":"remote-sha""#))
        XCTAssertTrue(json.contains(Data("hello team os".utf8).base64EncodedString()))
    }

    func testUpsertPullRequestCreatesWhenNoOpenBranchPRExists() async throws {
        let transport = MockGitHubTransport(
            queuedResponses: [
                .init(statusCode: 200, body: "[]"),
                .init(statusCode: 201, body: #"{"number":42,"html_url":"https://github.com/team-os/blank-slate/pull/42","draft":true,"head":{"ref":"teamos/matt/2026-05-04/demo"}}"#),
            ]
        )
        let client = GitHubRESTClient(
            configuration: GitHubServiceConfiguration(baseURL: URL(string: "https://example.com")!),
            tokenProvider: StaticGitHubTokenProvider(value: "secret"),
            transport: transport
        )
        let service = LiveGitHubService(client: client)
        let branch = BranchSession(
            repository: RepoDescriptor(owner: "team-os", name: "blank-slate"),
            branchName: "teamos/matt/2026-05-04/demo",
            baseBranch: "main",
            createdAt: "2026-05-04T18:00:00Z"
        )
        let plan = MutationPlan(
            kind: .moveCard,
            cardID: "KAN-2026-0001",
            changedFiles: [],
            fileWrites: [],
            commitMessage: "Move card\n\nAI-Model: gpt-5.4",
            pullRequestTitle: "Move card",
            pullRequestBody: "PR body"
        )

        let pr = try await service.upsertPullRequest(for: branch.repository, branch: branch, plan: plan)
        let requests = await transport.recordedRequests()
        let createBody = try XCTUnwrap(requests.last?.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: createBody) as? [String: Any])

        XCTAssertEqual(pr.number, 42)
        XCTAssertEqual(pr.headBranch, "teamos/matt/2026-05-04/demo")
        XCTAssertEqual(json["draft"] as? Bool, true)
        XCTAssertEqual(json["head"] as? String, "teamos/matt/2026-05-04/demo")
    }
}
