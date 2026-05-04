// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "TeamOSNative",
    platforms: [
        .macOS(.v13),
        .iOS(.v17),
    ],
    products: [
        .library(name: "TeamOSCore", targets: ["TeamOSCore"]),
    ],
    targets: [
        .target(
            name: "TeamOSCore",
            path: "TeamOSCore/Sources/TeamOSCore"
        ),
        .testTarget(
            name: "TeamOSCoreTests",
            dependencies: ["TeamOSCore"],
            path: "TeamOSCore/Tests/TeamOSCoreTests"
        ),
    ]
)
