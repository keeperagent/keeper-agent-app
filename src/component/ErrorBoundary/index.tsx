import { Component, ErrorInfo, ReactNode } from "react";
import { Container, BigNumber, Title, Description, RetryButton } from "./style";

type Props = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = {
  error: Error | null;
};

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) {
        return fallback(error, this.reset);
      }
      return <DefaultFallback error={error} onReset={this.reset} />;
    }

    return children;
  }
}

const DefaultFallback = ({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) => (
  <Container>
    <BigNumber>500</BigNumber>
    <Title>Oops! Something Went Wrong</Title>
    <Description>
      {error?.message
        ? error.message
        : "An unexpected error occurred. Please try again or restart the app."}
    </Description>
    <RetryButton onClick={onReset}>Try again</RetryButton>
  </Container>
);

export default ErrorBoundary;
