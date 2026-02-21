import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("UI ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: "Segoe UI, sans-serif" }}>
          <h1 style={{ color: "#b91c1c" }}>Something went wrong</h1>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <pre style={{ whiteSpace: "pre-wrap", color: "#555" }}>
            {this.state.error?.stack || ""}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
