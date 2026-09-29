// Tell React's act() check that this is a test environment.
// Without this, React 19 emits "not configured to support act()" warnings when
// using createRoot directly instead of @testing-library/react.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
