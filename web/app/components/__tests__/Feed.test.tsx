import { fireEvent, render, screen, act } from "@testing-library/react";
import Feed from "../Feed";
import { listResources } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  listResources: jest.fn(),
}));

const mockListResources = listResources as jest.MockedFunction<
  typeof listResources
>;

describe("Feed Component - Search Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockListResources.mockResolvedValue({ resources: [] });
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
});
