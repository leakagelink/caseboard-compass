import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocationStart } from '@/components/LocationStart';

const state = vi.hoisted(() => ({ user: { id: 'player' } as { id: string } | null, busy: false, authLoading: false, selectLocation: vi.fn() }));
vi.mock('@/components/GameProvider', () => ({ useGame: () => state }));
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: React.ReactNode }) => <a href="/auth">{children}</a> }));

describe('Optional location invitation', () => {
  const locate = vi.fn();
  beforeEach(() => {
    state.user = { id: 'player' }; state.busy = false;
    state.selectLocation.mockReset().mockResolvedValue(true); locate.mockReset();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: locate } });
  });
  afterEach(cleanup);

  it('does not request location until Yes is chosen', () => {
    render(<LocationStart invitation />);
    expect(locate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /YES/ }));
    expect(locate).toHaveBeenCalledTimes(1);
  });
  it('No enters the existing map without location access or assignment', () => {
    const skip = vi.fn(); render(<LocationStart invitation onSkip={skip} />);
    fireEvent.click(screen.getByRole('button', { name: /NO/ }));
    expect(skip).toHaveBeenCalledTimes(1);
    expect(locate).not.toHaveBeenCalled();
    expect(state.selectLocation).not.toHaveBeenCalled();
  });
  it('Yes assigns the approximate area and enters only after saving', async () => {
    locate.mockImplementation(success => success({ coords: { latitude: 22.57, longitude: 88.36, accuracy: 10 } }));
    const enter = vi.fn(); render(<LocationStart invitation onLocated={enter} />);
    fireEvent.click(screen.getByRole('button', { name: /YES/ }));
    await waitFor(() => expect(enter).toHaveBeenCalledTimes(1));
    expect(state.selectLocation).toHaveBeenCalledWith('2257:8836');
  });
  it('does not request location for a signed-out player', () => {
    state.user = null; render(<LocationStart invitation />);
    fireEvent.click(screen.getByRole('button', { name: /YES/ }));
    expect(locate).not.toHaveBeenCalled();
    expect(state.selectLocation).not.toHaveBeenCalled();
  });
  it('does not enter or assign cases after denied permission', () => {
    locate.mockImplementation((_success, failure) => failure({ code: 1 }));
    const enter = vi.fn(); render(<LocationStart invitation onLocated={enter} />);
    fireEvent.click(screen.getByRole('button', { name: /YES/ }));
    expect(state.selectLocation).not.toHaveBeenCalled();
    expect(enter).not.toHaveBeenCalled();
  });
  it('does not enter when saving fails', async () => {
    state.selectLocation.mockResolvedValue(false);
    locate.mockImplementation(success => success({ coords: { latitude: 22.57, longitude: 88.36, accuracy: 10 } }));
    const enter = vi.fn(); render(<LocationStart invitation onLocated={enter} />);
    fireEvent.click(screen.getByRole('button', { name: /YES/ }));
    await waitFor(() => expect(state.selectLocation).toHaveBeenCalledTimes(1));
    expect(enter).not.toHaveBeenCalled();
  });
});