import SwiftUI

struct TeamOSShellView: View {
    @ObservedObject var model: TeamOSWorkspaceModel

    var body: some View {
        NavigationSplitView {
            List(selection: $model.selectedCardID) {
                Section("Cards") {
                    ForEach(model.cards, id: \.id) { card in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(card.title)
                                .font(.headline)
                            Text("\(card.id) · \(card.status) · sitting with \(card.sittingWith ?? "nobody")")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .tag(card.id)
                    }
                }
            }
            .navigationTitle("Team OS")
        } content: {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    RepositorySetupPanel(model: model)
                    ValidationPanel(outcome: model.validationOutcome)
                    PullRequestPanel(branchSession: model.branchSession, pullRequestState: model.pullRequestState)
                }
                .padding(20)
            }
            .navigationTitle("Workspace")
        } detail: {
            CardDetailPanel(card: model.selectedCard)
                .navigationTitle(model.selectedCard?.id ?? "Card")
        }
    }
}

private struct RepositorySetupPanel: View {
    @ObservedObject var model: TeamOSWorkspaceModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Repository Access")
                .font(.title2.weight(.semibold))
            Text("Native writes remain disabled until GitHub access and Team OS markers are verified.")
                .foregroundStyle(.secondary)

            Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 10) {
                GridRow {
                    Text("Owner")
                    TextField("team-os", text: $model.repositoryOwner)
                        .textFieldStyle(.roundedBorder)
                }
                GridRow {
                    Text("Repository")
                    TextField("blank-slate", text: $model.repositoryName)
                        .textFieldStyle(.roundedBorder)
                }
                GridRow {
                    Text("Token")
                    SecureField("GitHub token", text: $model.accessToken)
                        .textFieldStyle(.roundedBorder)
                }
            }

            HStack(spacing: 12) {
                Button(model.isCheckingAccess ? "Checking..." : "Check Access") {
                    model.checkAccess()
                }
                .buttonStyle(.borderedProminent)
                .disabled(model.isCheckingAccess)

                StatusBadge(status: model.accessStatus)
            }

            Text(model.accessSummary)
                .font(.callout)

            if !model.presentMarkers.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Detected Team OS markers")
                        .font(.headline)
                    ForEach(model.presentMarkers, id: \.self) { marker in
                        Text(marker)
                            .font(.caption.monospaced())
                    }
                }
            }
        }
        .padding(16)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct ValidationPanel: View {
    let outcome: ValidationOutcome

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Validation")
                .font(.title3.weight(.semibold))
            Text(outcome.errors.isEmpty ? "No validation errors in the current Team OS snapshot." : "\(outcome.errors.count) validation errors detected.")
            Text(outcome.reportPath)
                .font(.caption.monospaced())
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct PullRequestPanel: View {
    let branchSession: BranchSession
    let pullRequestState: PullRequestState?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Branch and PR")
                .font(.title3.weight(.semibold))
            Text(branchSession.branchName)
                .font(.body.monospaced())
            Text("Base branch: \(branchSession.baseBranch)")
                .foregroundStyle(.secondary)
            if let pullRequestState {
                Text("PR #\(pullRequestState.number ?? 0) · \(pullRequestState.isDraft ? "Draft" : "Ready")")
                Text(pullRequestState.url ?? "No URL")
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)
            } else {
                Text("No pull request has been prepared yet.")
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct CardDetailPanel: View {
    let card: TeamOSCard?

    var body: some View {
        ScrollView {
            if let card {
                VStack(alignment: .leading, spacing: 16) {
                    Text(card.title)
                        .font(.largeTitle.weight(.bold))
                    Text(card.summary)
                        .foregroundStyle(.secondary)
                    Label("Owner: \(card.owner)", systemImage: "person.crop.circle")
                    Label("Status: \(card.status)", systemImage: "square.stack.3d.up")
                    Label("Sitting with: \(card.sittingWith ?? "nobody")", systemImage: "clock.arrow.circlepath")

                    if !card.artifacts.isEmpty {
                        Text("Artifacts")
                            .font(.headline)
                        ForEach(card.artifacts, id: \.path) { artifact in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(artifact.label)
                                    .font(.subheadline.weight(.semibold))
                                Text(artifact.path)
                                    .font(.caption.monospaced())
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .padding(20)
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "rectangle.stack")
                        .font(.system(size: 36))
                        .foregroundStyle(.secondary)
                    Text("No Card Selected")
                        .font(.title3.weight(.semibold))
                    Text("Choose a Team OS card to inspect its summary, owner, and linked artifacts.")
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, minHeight: 240)
                .padding(20)
            }
        }
    }
}

private struct StatusBadge: View {
    let status: RepoAccessStatus

    var body: some View {
        Text(label)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }

    private var label: String {
        switch status {
        case .notConfigured: return "Not configured"
        case .authRequired: return "Auth required"
        case .checking: return "Checking"
        case .readOnly: return "Read only"
        case .writeReady: return "Write ready"
        case .invalidRepo: return "Invalid repo"
        case .missingTeamOSMarkers: return "Missing markers"
        case .insufficientPermissions: return "Insufficient permissions"
        }
    }

    private var color: Color {
        switch status {
        case .writeReady:
            return .green
        case .checking:
            return .blue
        case .readOnly, .authRequired, .notConfigured:
            return .orange
        case .invalidRepo, .missingTeamOSMarkers, .insufficientPermissions:
            return .red
        }
    }
}
