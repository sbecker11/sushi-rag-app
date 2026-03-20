import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import AIAssistant from '../AIAssistant';

vi.mock('axios');

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { agent: false, rag: true, vectorStore: true }
    });
    axios.post.mockResolvedValue({
      data: { answer: 'Try the spicy tuna roll.' }
    });
  });

  test('renders floating Ask AI button when closed', () => {
    render(<AIAssistant />);
    expect(screen.getByRole('button', { name: /ask ai/i })).toBeInTheDocument();
  });

  test('opens panel and shows online when RAG available', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/assistant/status'));
    });
    expect(screen.getByText(/online/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask about our menu/i)).toBeInTheDocument();
  });

  test('sends message via ask when agent is off', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/ask about our menu/i)).not.toBeDisabled());
    const input = screen.getByPlaceholderText(/ask about our menu/i);
    await user.type(input, 'vegetarian?');
    await user.click(screen.getByRole('button', { name: /^→$/ }));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/assistant/ask'),
        expect.objectContaining({ question: 'vegetarian?' })
      );
    });
    expect(await screen.findByText(/spicy tuna/i)).toBeInTheDocument();
  });

  test('uses chat endpoint when agent is on', async () => {
    axios.get.mockResolvedValue({
      data: { agent: true, rag: true, vectorStore: true }
    });
    axios.post.mockResolvedValue({
      data: { response: 'Agent says hi', toolsUsed: [{ tool: 'search_menu', input: {} }] }
    });
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    await waitFor(() => expect(screen.getByText(/agent/i)).toBeInTheDocument());
    const input = screen.getByPlaceholderText(/ask about our menu/i);
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /^→$/ }));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/assistant/chat'),
        expect.objectContaining({ message: 'hello' })
      );
    });
    expect(await screen.findByText(/agent says hi/i)).toBeInTheDocument();
    expect(await screen.findByText(/search_menu/i)).toBeInTheDocument();
  });

  test('shows error message when request fails', async () => {
    axios.post.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/ask about our menu/i)).not.toBeDisabled());
    await user.type(screen.getByPlaceholderText(/ask about our menu/i), 'x');
    await user.click(screen.getByRole('button', { name: /^→$/ }));
    expect(
      await screen.findByText(/sorry, i encountered an error/i)
    ).toBeInTheDocument();
  });

  test('example question fills input', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    await waitFor(() => expect(screen.getByText(/show me spicy options/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /show me spicy options/i }));
    expect(screen.getByPlaceholderText(/ask about our menu/i)).toHaveValue('Show me spicy options');
  });

  test('clear resets conversation', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/ask about our menu/i)).not.toBeDisabled());
    await user.type(screen.getByPlaceholderText(/ask about our menu/i), 'test');
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.getByPlaceholderText(/ask about our menu/i)).toHaveValue('');
  });

  test('closes panel with ×', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByRole('button', { name: /ask ai/i }));
    await user.click(screen.getByRole('button', { name: '×' }));
    expect(screen.getByRole('button', { name: /ask ai/i })).toBeInTheDocument();
  });
});
