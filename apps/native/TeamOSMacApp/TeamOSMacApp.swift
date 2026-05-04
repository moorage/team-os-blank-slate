import SwiftUI

@main
struct TeamOSMacApp: App {
    @StateObject private var model = TeamOSWorkspaceModel()

    var body: some Scene {
        WindowGroup("Team OS") {
            TeamOSShellView(model: model)
                .frame(minWidth: 1080, minHeight: 700)
        }
        .defaultSize(width: 1280, height: 820)
    }
}
