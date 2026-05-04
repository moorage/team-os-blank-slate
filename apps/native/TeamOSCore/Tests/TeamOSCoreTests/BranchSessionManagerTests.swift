import Foundation
import XCTest

@testable import TeamOSCore

final class BranchSessionManagerTests: XCTestCase {
    func testBranchNaming() {
        let manager = BranchSessionManager()
        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.timeZone = TimeZone(secondsFromGMT: 0)
        components.year = 2026
        components.month = 5
        components.day = 4
        let date = components.date!

        let branchName = manager.branchName(for: "Matt Moore", date: date, slug: "Family Preferences Quiz")

        XCTAssertEqual(branchName, "teamos/matt-moore/2026-05-04/family-preferences-quiz")
    }
}
