import {
  ApiOutlined,
  AppstoreOutlined,
  LockOutlined,
  QuestionCircleOutlined,
  ShareAltOutlined,
  SwapOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Button, Card, Col, Empty, Pagination,Row, Statistic, Tag, Tooltip  } from 'antd';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
 Line,LineChart,  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis } from 'recharts';
import { history, useIntl } from 'umi';

import { fetchMonitoringSummary } from '@/services/monitoring';

import { getGrafanaURL } from './service';
type InstanceSummary = {
  name: string;
  prefix: string;
  status: string;
  counters: {
    routes: number;
    services: number;
    upstreams: number;
    consumers: number;
    protos: number;
    global_rules: number;
    ssls: number;
  };
  metrics?: {
    connections_accepted?: number;
    connections_active?: number;
    connections_handled?: number;
    connections_reading?: number;
    connections_writing?: number;
    connections_waiting?: number;
    requests_total?: number;
  };
};

const Dashboard: React.FC = () => {
  const [grafanaURL, setGrafanaURL] = useState<string | undefined>();
  const [instances, setInstances] = useState<InstanceSummary[]>([]);
  const { formatMessage } = useIntl();
  const token = localStorage.getItem('token');
  const instance = token ? jwtDecode<{ instance: string }>(token).instance : '';
const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 3; 
  useEffect(() => {
    getGrafanaURL().then((url) => setGrafanaURL(url));
    if (!instance) {
      fetchMonitoringSummary().then((res) => {
        setInstances(res.instances || []);
      });
    }
  }, []);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const metricsData = instances.map((inst) => ({
    name: inst.name,
    accepted: inst.metrics?.connections_accepted || 0,
    active: inst.metrics?.connections_active || 0,
    handled: inst.metrics?.connections_handled || 0,
    reading: inst.metrics?.connections_reading || 0,
    writing: inst.metrics?.connections_writing || 0,
    waiting: inst.metrics?.connections_waiting || 0,
    requestsTotal: inst.metrics?.requests_total || 0,
  }));
const paginatedInstances = instances.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  return (
    <PageHeaderWrapper
      title={
        <>
          {formatMessage({ id: 'menu.dashboard' })}&nbsp;
          <Tooltip title={formatMessage({ id: 'page.dashboard.tip' })}>
            <QuestionCircleOutlined />
          </Tooltip>
        </>
      }
    >
      {/* Grafana Card */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        {!grafanaURL ? (
          <Empty
            image="empty.svg"
            imageStyle={{ height: 60 }}
            description={formatMessage({ id: 'page.dashboard.empty.description.grafanaNotConfig' })}
          >
            <Button
              type="primary"
              onClick={() => history.replace({ pathname: '/settings' })}
            >
              {formatMessage({ id: 'page.dashboard.button.grafanaConfig' })}
            </Button>
          </Empty>
        ) : (
          <iframe title="dashboard" src={grafanaURL} width="100%" height="860" frameBorder="0" />
        )}
      </Card>

      {/* Instance Cards */}
      {!instance && (
        <>
        <Row gutter={[24, 24]}>
          {paginatedInstances.map((inst) => (
            <Col xs={24} sm={12} md={12} lg={8} xl={8} key={inst.name}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-blue-700">{inst.name}</h2>
                  <Tag color="geekblue" style={{ fontWeight: 600 }}>
                    Instance
                  </Tag>
                </div>

                <div className="flex items-center mb-3">
                  <Tag color="blue" style={{ fontWeight: 500 }}>
                    Prefix: {inst.prefix}
                  </Tag>
                  <Tooltip title="The ETCD prefix used for this instance">
                    <QuestionCircleOutlined className="ml-2 text-gray-400" />
                  </Tooltip>
                </div>

                <Tag color={inst.status === 'UP' ? 'green' : 'red'} style={{ marginBottom: 16 }}>
                  {inst.status}
                </Tag>

                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="Routes" value={inst.counters.routes} prefix={<ShareAltOutlined />} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Services" value={inst.counters.services} prefix={<AppstoreOutlined />} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Upstreams" value={inst.counters.upstreams} prefix={<SwapOutlined />} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Consumers" value={inst.counters.consumers} prefix={<UserOutlined />} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Protocol Buffers" value={inst.counters.protos} prefix={<ApiOutlined />} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Plugins" value={inst.counters.global_rules} prefix={<ToolOutlined />} />
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={8}>
                    <Statistic title="SSLs" value={inst.counters.ssls} prefix={<LockOutlined />} />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
         {instances.length > pageSize && (<div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={instances.length}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>  
      )}

      {/* Metrics Charts */}
      {!instance && (
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Connections per Instance " bordered={false} style={{ borderRadius: 16 }}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={metricsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartTooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="accepted" stackId="a" fill="#1890ff" radius={[8, 8, 0, 0]} name="Accepted" />
                  <Bar dataKey="active" stackId="a" fill="#52c41a" radius={[8, 8, 0, 0]} name="Active" />
                  <Bar dataKey="handled" stackId="a" fill="#faad14" radius={[8, 8, 0, 0]} name="Handled" />
                  <Bar dataKey="reading" stackId="a" fill="#13c2c2" radius={[8, 8, 0, 0]} name="Reading" />
                  <Bar dataKey="writing" stackId="a" fill="#722ed1" radius={[8, 8, 0, 0]} name="Writing" />
                  <Bar dataKey="waiting" stackId="a" fill="#ff4d4f" radius={[8, 8, 0, 0]} name="Waiting" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Total Requests per Instance" bordered={false} style={{ borderRadius: 16 }}>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metricsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartTooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="requestsTotal"
                    stroke="#ff4d4f"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Total Requests"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </PageHeaderWrapper>
  );
};

export default Dashboard;
