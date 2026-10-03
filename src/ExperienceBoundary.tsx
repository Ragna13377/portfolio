import { Component, type ReactNode } from 'react';
import ReadablePortfolio from './ReadablePortfolio';

export default class ExperienceBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <ReadablePortfolio error />
    ) : (
      this.props.children
    );
  }
}
