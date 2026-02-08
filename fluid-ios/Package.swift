// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "FluidApp",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "FluidApp",
            targets: ["FluidApp"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ml-explore/mlx-swift-lm", branch: "main"),
        .package(url: "https://github.com/weichsel/ZIPFoundation.git", .upToNextMajor(from: "0.9.0")),
        .package(url: "https://github.com/stephencelis/SQLite.swift.git", .upToNextMajor(from: "0.14.1"))
    ],
    targets: [
        .target(
            name: "FluidApp",
            dependencies: [
                .product(name: "MLXLLM", package: "mlx-swift-lm"),
                .product(name: "ZIPFoundation", package: "ZIPFoundation"),
                .product(name: "SQLite", package: "SQLite.swift")
            ],
            resources: [
                .process("Resources")
            ]
        )
    ]
)
