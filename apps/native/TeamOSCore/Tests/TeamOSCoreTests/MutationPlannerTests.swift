import XCTest

@testable import TeamOSCore

final class MutationPlannerTests: XCTestCase {
    private let planner = MutationPlanner()

    func testMoveCardPlanIncludesStatusEventAndViews() throws {
        let plan = try planner.moveCardPlan(
            cardID: "KAN-2026-0001",
            toStatus: "delivery",
            timestamp: "2026-05-04T13:00:00Z",
            updatedCardContents: "status: delivery\n",
            statusEventContents: "type: status-changed\n",
            accessStatus: .writeReady
        )

        XCTAssertEqual(plan.kind, .moveCard)
        XCTAssertTrue(plan.changedFiles.contains { $0.path == "kanban/cards/KAN-2026-0001/card.md" })
        XCTAssertTrue(plan.changedFiles.contains { $0.path == "kanban/cards/KAN-2026-0001/events/2026-05-04T13-00-00Z-status-changed.yaml" })
        XCTAssertTrue(plan.changedFiles.contains { $0.path == "kanban/views/recently-moved.md" })
        XCTAssertEqual(plan.fileWrites.first?.contents, "status: delivery\n")
    }

    func testAddCommentPlanIncludesCommentFile() throws {
        let plan = try planner.addCommentPlan(
            cardID: "KAN-2026-0002",
            author: "matt",
            timestamp: "2026-05-04T14:15:00Z",
            commentContents: "comment body\n",
            accessStatus: .writeReady
        )

        XCTAssertEqual(plan.kind, .addComment)
        XCTAssertTrue(plan.changedFiles.contains { $0.path == "kanban/cards/KAN-2026-0002/comments/2026-05-04T14-15-00Z-matt.md" })
        XCTAssertEqual(plan.fileWrites.first?.contents, "comment body\n")
    }

    func testChangeSittingWithPlanRequiresWriteReady() {
        XCTAssertThrowsError(
            try planner.changeSittingWithPlan(
                cardID: "KAN-2026-0001",
                sittingWith: "analytics",
                timestamp: "2026-05-04T15:00:00Z",
                updatedCardContents: "sitting_with: analytics\n",
                sittingWithEventContents: "type: sitting-with-changed\n",
                accessStatus: .authRequired
            )
        ) { error in
            XCTAssertEqual(error as? GitHubServiceError, .writeAccessRequired(.authRequired))
        }
    }
}
