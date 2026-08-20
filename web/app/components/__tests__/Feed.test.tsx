import { fireEvent, render, screen, act } from "@testing-library/react";
import Feed from "../Feed";
import { listResources } from "@/lib/api";
import { AuthState, Resource } from "@/lib/types";
import { useReactionHistory } from "@/lib/useReactionHistory";

const reactionHistory = ["❤️", "🔥"];
const recordReaction = jest.fn();

const auth: AuthState = {
  token: "test-token",
  user: {
    id: "u2",
    displayName: "Diego",
    email: "d@example.com",
    role: "member",
  },
};

const resource: Resource = {
  id: "1",
  title: "MDN Async/Await Guide",
  url: "https://developer.mozilla.org",
  description: "Great explainer for async/await.",
  tags: ["javascript", "beginner"],
  createdAt: new Date().toISOString(),
  submittedBy: {
    id: "u1",
    displayName: "Amina Yusuf",
    email: "amina@example.com",
    role: "member",
  },
  reactions: [],
};

jest.mock("@/lib/api", () => ({
  listResources: jest.fn(),
}));

jest.mock("@/lib/useReactionHistory", () => ({
  useReactionHistory: jest.fn(),
}));

jest.mock("../ResourceCard", () => ({
  __esModule: true,
  default: ({
    reactionHistory,
    onReactionSelected,
  }: {
    reactionHistory: string[];
    onReactionSelected: (emoji: string) => void;
  }) => (
    <button
      type="button"
      data-history={reactionHistory.join(",")}
      onClick={() => onReactionSelected("❤️")}
    >
      Mock resource card
    </button>
  ),
}));

const mockListResources = listResources as jest.MockedFunction<
  typeof listResources
>;

describe("Feed Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockListResources.mockResolvedValue({ resources: [resource] });
    (useReactionHistory as jest.Mock).mockReturnValue({
      history: reactionHistory,
      recordReaction,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the search input field", async () => {
    await act(async () => {
      render(<Feed auth={null} socket={null} />);
    });

    expect(
      screen.getByPlaceholderText("Search resources..."),
    ).toBeInTheDocument();
  });

  it("triggers listResources with debounced search query after 300ms", async () => {
    await act(async () => {
      render(<Feed auth={null} socket={null} />);
    });

    expect(mockListResources).toHaveBeenCalledWith({
      q: undefined,
      tag: undefined,
      submittedBy: undefined,
    });

    const searchInput = screen.getByPlaceholderText("Search resources...");

    act(() => {
      fireEvent.change(searchInput, { target: { value: "react" } });
    });

    expect(mockListResources).toHaveBeenLastCalledWith({
      q: undefined,
      tag: undefined,
      submittedBy: undefined,
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(mockListResources).toHaveBeenLastCalledWith({
      q: "react",
      tag: undefined,
      submittedBy: undefined,
    });
  });

  it("shares reaction history and its update callback with resource cards", async () => {
    await act(async () => {
      render(<Feed auth={auth} socket={null} />);
    });

    const card = await screen.findByRole("button", {
      name: "Mock resource card",
    });

    expect(card).toHaveAttribute("data-history", reactionHistory.join(","));

    fireEvent.click(card);

    expect(recordReaction).toHaveBeenCalledWith("❤️");
    expect(recordReaction).toHaveBeenCalledTimes(1);
  });
});
