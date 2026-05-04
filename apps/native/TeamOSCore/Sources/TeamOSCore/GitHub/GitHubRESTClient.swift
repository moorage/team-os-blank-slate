import Foundation

public struct GitHubServiceConfiguration: Equatable, Sendable {
    public let baseURL: URL
    public let apiVersion: String
    public let userAgent: String

    public init(
        baseURL: URL = URL(string: "https://api.github.com")!,
        apiVersion: String = "2022-11-28",
        userAgent: String = "team-os-native"
    ) {
        self.baseURL = baseURL
        self.apiVersion = apiVersion
        self.userAgent = userAgent
    }
}

public protocol GitHubHTTPTransport: Sendable {
    func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse)
}

public struct URLSessionGitHubHTTPTransport: GitHubHTTPTransport {
    private let session: URLSession

    public init(session: URLSession = .shared) {
        self.session = session
    }

    public func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GitHubServiceError.invalidResponse("Expected an HTTPURLResponse.")
        }
        return (data, httpResponse)
    }
}

public struct GitHubHTTPResponse: Equatable, Sendable {
    public let data: Data
    public let statusCode: Int

    public init(data: Data, statusCode: Int) {
        self.data = data
        self.statusCode = statusCode
    }
}

public struct GitHubRESTClient: Sendable {
    private let configuration: GitHubServiceConfiguration
    private let tokenProvider: GitHubTokenProviding
    private let transport: GitHubHTTPTransport
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(
        configuration: GitHubServiceConfiguration = GitHubServiceConfiguration(),
        tokenProvider: GitHubTokenProviding,
        transport: GitHubHTTPTransport = URLSessionGitHubHTTPTransport()
    ) {
        self.configuration = configuration
        self.tokenProvider = tokenProvider
        self.transport = transport
    }

    public func get<Response: Decodable>(
        pathComponents: [String],
        query: [URLQueryItem] = []
    ) async throws -> Response {
        let response = try await send(method: "GET", pathComponents: pathComponents, query: query)
        guard (200..<300).contains(response.statusCode) else {
            throw mapError(response)
        }
        do {
            return try decoder.decode(Response.self, from: response.data)
        } catch {
            throw GitHubServiceError.decoding(String(describing: error))
        }
    }

    public func send(
        method: String,
        pathComponents: [String],
        query: [URLQueryItem] = [],
        body: Data? = nil
    ) async throws -> GitHubHTTPResponse {
        let token = try await tokenProvider.token()
        let url = try buildURL(pathComponents: pathComponents, query: query)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.setValue(configuration.apiVersion, forHTTPHeaderField: "X-GitHub-Api-Version")
        request.setValue(configuration.userAgent, forHTTPHeaderField: "User-Agent")
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let (data, response) = try await transport.send(request)
        return GitHubHTTPResponse(data: data, statusCode: response.statusCode)
    }

    public func encodedBody<Body: Encodable>(_ body: Body) throws -> Data {
        do {
            return try encoder.encode(body)
        } catch {
            throw GitHubServiceError.decoding(String(describing: error))
        }
    }

    public func mapError(_ response: GitHubHTTPResponse) -> GitHubServiceError {
        let message = String(data: response.data, encoding: .utf8) ?? ""
        switch response.statusCode {
        case 401:
            return .authenticationRequired
        case 404:
            return .repositoryNotFound(message)
        default:
            return .requestFailed(status: response.statusCode, message: message)
        }
    }

    private func buildURL(pathComponents: [String], query: [URLQueryItem]) throws -> URL {
        guard var components = URLComponents(url: configuration.baseURL, resolvingAgainstBaseURL: false) else {
            throw GitHubServiceError.invalidResponse("Failed to build URL components from base URL.")
        }
        let trimmedPath = pathComponents.map { component in
            component.split(separator: "/").map(String.init)
        }.flatMap { $0 }
        components.path = "/" + trimmedPath.joined(separator: "/")
        if !query.isEmpty {
            components.queryItems = query
        }
        guard let url = components.url else {
            throw GitHubServiceError.invalidResponse("Failed to build URL for path \(pathComponents.joined(separator: "/")).")
        }
        return url
    }
}
