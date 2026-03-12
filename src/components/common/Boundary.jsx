import PropType from 'prop-types';
import React, { Component } from 'react';

class Boundary extends Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  componentDidCatch(error) {
    // Log chi tiết lỗi ra console để debug trên Vercel
    // (console.error vẫn hiển thị trong DevTools)
    // eslint-disable-next-line no-console
    console.error(error);
  }

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="loader">
          <h3>:( Something went wrong.</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 16 }}>
            {error && error.toString()}
          </pre>
        </div>
      );
    }

    return children;
  }
}

Boundary.propTypes = {
  children: PropType.oneOfType([
    PropType.arrayOf(PropType.node),
    PropType.node
  ]).isRequired
};

export default Boundary;
