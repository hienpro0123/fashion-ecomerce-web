import PropType from 'prop-types';
import React, { useState } from 'react';

const UserTabPanel = ({ children }) => children;

const UserTab = (props) => {
  const { children, defaultActiveTab } = props;
  const tabs = React.Children.toArray(children);
  const [activeTab, setActiveTab] = useState(defaultActiveTab ?? (tabs[0].props.index || 0));
  const onClickTabItem = (index) => setActiveTab(index);

  return (
    <div className="user-tab">
      <div className="user-tab-nav">
        <ul className="user-tab-menu">
          {tabs.map((child) => (
            <li
              className={`user-tab-item ${child.props.index === activeTab ? 'user-tab-active' : ''}`}
              key={child.props.label}
              role="presentation"
              onClick={() => onClickTabItem(child.props.index)}
            >
              {child.props.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="user-tab-content">
        {tabs.map((child) => {
          if (child.props.index !== activeTab) return null;

          return child.props.children;
        })}
      </div>
    </div>
  );
};

UserTabPanel.propTypes = {
  children: PropType.node.isRequired,
  index: PropType.number.isRequired,
  label: PropType.string.isRequired
};

UserTab.propTypes = {
  children: PropType.oneOfType([
    PropType.arrayOf(PropType.node),
    PropType.node
  ]).isRequired,
  defaultActiveTab: PropType.number
};

UserTab.defaultProps = {
  defaultActiveTab: undefined
};

UserTab.Panel = UserTabPanel;

export default UserTab;
