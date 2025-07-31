import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Alert, Table, Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [systemHealth, setSystemHealth] = useState({
    availability: 99.95,
    latency: 145,
    errorRate: 0.05,
    recoveryTime: 2.3
  });

  const [recentChaosExperiments] = useState([
    {
      key: '1',
      name: 'Pod Kill Experiment',
      status: 'completed',
      duration: '2m 15s',
      impact: 'low',
      timestamp: '2024-01-15 14:30:00'
    },
    {
      key: '2',
      name: 'Network Latency Test',
      status: 'running',
      duration: '1m 45s',
      impact: 'medium',
      timestamp: '2024-01-15 14:25:00'
    },
    {
      key: '3',
      name: 'CPU Pressure Test',
      status: 'completed',
      duration: '3m 10s',
      impact: 'high',
      timestamp: '2024-01-15 14:20:00'
    }
  ]);

  const [activeAlerts] = useState([
    {
      key: '1',
      severity: 'warning',
      message: 'High CPU usage detected on node-1',
      timestamp: '2024-01-15 14:28:00'
    },
    {
      key: '2',
      severity: 'info',
      message: 'Auto-scaling triggered for user-service',
      timestamp: '2024-01-15 14:25:00'
    }
  ]);

  const performanceData = [
    { time: '14:00', requests: 1200, latency: 120, errors: 2 },
    { time: '14:05', requests: 1350, latency: 145, errors: 1 },
    { time: '14:10', requests: 1100, latency: 130, errors: 0 },
    { time: '14:15', requests: 1600, latency: 180, errors: 3 },
    { time: '14:20', requests: 1400, latency: 150, errors: 1 },
    { time: '14:25', requests: 1800, latency: 200, errors: 5 },
    { time: '14:30', requests: 1700, latency: 190, errors: 2 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'running': return 'blue';
      case 'failed': return 'red';
      default: return 'default';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'default';
    }
  };

  const chaosColumns = [
    {
      title: 'Experiment Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      render: (impact) => <Tag color={getImpactColor(impact)}>{impact}</Tag>
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    }
  ];

  const alertColumns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => <Tag color={getSeverityColor(severity)}>{severity}</Tag>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="System Availability"
              value={systemHealth.availability}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress percent={systemHealth.availability} showInfo={false} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Latency"
              value={systemHealth.latency}
              suffix="ms"
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Error Rate"
              value={systemHealth.errorRate}
              suffix="%"
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Recovery Time"
              value={systemHealth.recoveryTime}
              suffix="min"
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card title="Performance Metrics" size="small">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Requests/sec" />
                <Line type="monotone" dataKey="latency" stroke="#82ca9d" name="Latency (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Recent Chaos Experiments" size="small">
            <Table 
              dataSource={recentChaosExperiments} 
              columns={chaosColumns} 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Active Alerts" size="small">
            <Table 
              dataSource={activeAlerts} 
              columns={alertColumns} 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Alert
            message="System Status: Healthy"
            description="All services are running normally. SLO targets are being met. No critical issues detected."
            type="success"
            showIcon
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 