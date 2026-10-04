import { Component, type ReactNode } from 'react';
import DesktopFallback from '../../shared/ui/desktop-fallback';

export default class ExperienceBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <DesktopFallback error /> : this.props.children;
  }
}
