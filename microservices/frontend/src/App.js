import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import { 
  DashboardOutlined, 
  ExperimentOutlined, 
  MonitorOutlined,
  AlertOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import ChaosExperiments from './components/ChaosExperiments';
import Monitoring from './components/Monitoring';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'chaos',
      icon: <ExperimentOutlined />,
      label: 'Chaos Experiments',
    },
    {
      key: 'monitoring',
      icon: <MonitorOutlined />,
      label: 'Monitoring',
    },
    {
      key: 'alerts',
      icon: <AlertOutlined />,
      label: 'Alerts',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={250} theme="dark">
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              Chaos Platform
            </Title>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: '0 24px' }}>
            <Title level={3} style={{ margin: 0 }}>
              Self-Healing Kubernetes Platform
            </Title>
          </Header>
          <Content style={{ margin: '24px', padding: '24px', background: '#fff' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chaos" element={<ChaosExperiments />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App; 