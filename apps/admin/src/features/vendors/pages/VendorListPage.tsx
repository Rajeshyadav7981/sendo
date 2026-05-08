import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Modal, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { useDeleteVendor, useUpdateVendor, useVendors } from '../vendors.hooks';
import type { CreateVendorBody, Vendor } from '../vendors.api';

interface Tile {
  label: string;
  path: string;
  icon: string;
  desc: string;
}

const TILES: readonly Tile[] = [
  { label: 'Vendor Onboarding', path: '/vendor-onboarding', icon: '🏢', desc: 'Register new vendors' },
  { label: 'Trip Sheet', path: '/trip-sheet', icon: '🗺️', desc: 'Manage trip assignments' },
  { label: 'Advance', path: '/advance', icon: '💰', desc: 'Vendor advance payments' },
  { label: 'Deductions', path: '/deduction', icon: '📉', desc: 'Track vendor deductions' },
  { label: 'Payments', path: '/payment', icon: '💳', desc: 'Process vendor payments' },
];

type EditFields = Partial<CreateVendorBody>;

export default function VendorListPage(): JSX.Element {
  const navigate = useNavigate();
  const { data, isLoading } = useVendors();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vendor | null>(null);
  const [form] = Form.useForm<EditFields>();

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        supplierName: editing.supplierName,
        venderSiteCode: editing.venderSiteCode,
        phoneNumber: editing.phoneNumber,
        emailId: editing.emailId,
        panNumber: editing.panNumber,
        IFSCcode: editing.IFSCcode,
        beneficiaryName: editing.beneficiaryName,
        accountNumber: editing.accountNumber,
        branchName: editing.branchName,
        state: editing.state,
        pinCode: editing.pinCode,
        townCity: editing.townCity,
        addressLine1: editing.addressLine1,
        addressLine2: editing.addressLine2 ?? '',
        serviceRegistrationNumber: editing.serviceRegistrationNumber,
      });
    } else {
      form.resetFields();
    }
  }, [editing, form]);

  const filtered = useMemo<Vendor[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (v) =>
        (v.supplierName ?? '').toLowerCase().includes(q) ||
        (v.phoneNumber ?? '').toLowerCase().includes(q) ||
        (v.emailId ?? '').toLowerCase().includes(q) ||
        (v.panNumber ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const handleSave = async (): Promise<void> => {
    if (!editing) return;
    const values = await form.validateFields();
    updateMutation.mutate(
      { id: editing.id, body: values },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (): void => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  return (
    <SendoLegacyPage
      title="Vendor Management"
      toolbar={
        <Link to="/vendor-onboarding" className="sendo-btn-yellow">
          + New Vendor
        </Link>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4 pt-2 pb-6 max-w-4xl">
        {TILES.map((t) => (
          <button
            key={t.path}
            type="button"
            onClick={() => navigate(t.path)}
            className="bg-white rounded-lg shadow border-2 border-transparent hover:border-yellow-400 hover:-translate-y-0.5 transition-all p-6 text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="font-bold text-sm mb-1 text-black">{t.label}</div>
            <div className="text-xs text-gray-500">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center px-4 mb-3">
        <div className="font-bold text-base">Vendor Records</div>
        <Input.Search
          placeholder="Search vendor / phone / email / PAN…"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

      <Table<Vendor>
        rowKey="id"
        loading={isLoading}
        dataSource={filtered}
        pagination={{ pageSize: 25 }}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Supplier', dataIndex: 'supplierName' },
          {
            title: 'Site code',
            dataIndex: 'venderSiteCode',
            render: (v: string) => <Tag color={v === 'Rental' ? 'blue' : 'gold'}>{v}</Tag>,
          },
          { title: 'Phone', dataIndex: 'phoneNumber' },
          { title: 'Email', dataIndex: 'emailId' },
          { title: 'PAN', dataIndex: 'panNumber' },
          { title: 'IFSC', dataIndex: 'IFSCcode' },
          { title: 'Account', dataIndex: 'accountNumber' },
          { title: 'Branch', dataIndex: 'branchName' },
          { title: 'City', dataIndex: 'townCity' },
          { title: 'State', dataIndex: 'state' },
          { title: 'PIN', dataIndex: 'pinCode' },
          {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            render: (_, v) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(v)}>
                  Edit
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setConfirmDelete(v)}
                >
                  Delete
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? `Edit Vendor — ${editing.supplierName}` : 'Edit Vendor'}
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => void handleSave()}
        okText="Save changes"
        confirmLoading={updateMutation.isPending}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <Form.Item label="Supplier Name" name="supplierName" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Site Code" name="venderSiteCode">
              <Input />
            </Form.Item>
            <Form.Item label="Phone" name="phoneNumber">
              <Input />
            </Form.Item>
            <Form.Item label="Email" name="emailId">
              <Input />
            </Form.Item>
            <Form.Item label="PAN" name="panNumber">
              <Input />
            </Form.Item>
            <Form.Item label="IFSC" name="IFSCcode">
              <Input />
            </Form.Item>
            <Form.Item label="Beneficiary" name="beneficiaryName">
              <Input />
            </Form.Item>
            <Form.Item label="Account Number" name="accountNumber">
              <Input />
            </Form.Item>
            <Form.Item label="Branch" name="branchName">
              <Input />
            </Form.Item>
            <Form.Item label="State" name="state">
              <Input />
            </Form.Item>
            <Form.Item label="PIN" name="pinCode">
              <Input />
            </Form.Item>
            <Form.Item label="Town/City" name="townCity">
              <Input />
            </Form.Item>
            <Form.Item label="Address Line 1" name="addressLine1">
              <Input />
            </Form.Item>
            <Form.Item label="Address Line 2" name="addressLine2">
              <Input />
            </Form.Item>
            <Form.Item label="Service Registration #" name="serviceRegistrationNumber">
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Delete vendor?"
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onOk={handleDelete}
        okText="Delete"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
      >
        <p>
          This will delete <strong>{confirmDelete?.supplierName}</strong>. This action cannot be undone from the UI.
        </p>
      </Modal>
    </SendoLegacyPage>
  );
}
