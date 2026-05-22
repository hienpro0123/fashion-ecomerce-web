import React from 'react';
import { shallow } from 'enzyme';
import App from '../../src/App';

jest.mock('@/components/common', () => ({
  Preloader: () => null
}));
jest.mock('@/routers/AppRouter', () => () => null);
jest.mock('@/components/chatbox/ChatBox', () => () => null);

const store = {
  dispatch: jest.fn(),
  getState: jest.fn(() => ({})),
  subscribe: jest.fn()
};

const persistor = {
  flush: jest.fn(),
  getState: jest.fn(() => ({ bootstrapped: true })),
  pause: jest.fn(),
  persist: jest.fn(),
  purge: jest.fn(),
  subscribe: jest.fn()
};

test('Should render App component', () => {
  const wrapper = shallow(<App store={store} persistor={persistor} />);

  expect(wrapper).toMatchSnapshot();
});

// More tests ...
