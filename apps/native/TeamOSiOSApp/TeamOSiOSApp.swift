import SwiftUI

@main
struct TeamOSiOSApp: App {
    @StateObject private var model = TeamOSWorkspaceModel()

    var body: some Scene {
        WindowGroup {
            TeamOSShellView(model: model)
        }
    }
}
