import { useMemo, useState } from 'react';
import { Button, Input, Modal, Table, Tag, type TableColumnsType } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from '../employees.hooks';
import type { Employee } from '../employees.api';

export default function EmployeeListPage(): JSX.Element {
  const employees = useEmployees();
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<Employee>({ name: '' });

  const filtered = useMemo<Employee[]>(() => {
    const list = employees.data ?? [];
    return list.filter((e) =>
      (e.name || '').toLowerCase().includes(search.toLowerCase()),
    );
  }, [employees.data, search]);

  const downloadCSV = (): void => {
    const header = 'Name,Password,Role\n';
    const rows = filtered
      .map((e) => `${e.name},${e.password || ''},${e.role || ''}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'employees.csv';
    a.click();
  };

  const askDelete = (name: string): void => {
    Modal.confirm({
      title: `Delete employee "${name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(name),
    });
  };

  const openEdit = (e: Employee): void => {
    setEditing(e);
    setEditForm({ ...e });
  };

  const saveEdit = (): void => {
    if (!editing) return;
    update.mutate(
      { name: editing.name, body: editForm },
      { onSuccess: () => setEditing(null) },
    );
  };

  const columns: TableColumnsType<Employee> = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, align: 'center' },
    { title: 'Name', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
    {
      title: 'Password',
      dataIndex: 'password',
      align: 'center',
      render: (v?: string) =>
        v ? (
          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>🔒 Set</span>
        ) : (
          <span style={{ color: '#c0392b' }}>⚠ None</span>
        ),
    },
    { title: 'Role', dataIndex: 'role', render: (v?: string) => v || '—', align: 'center' },
    {
      title: 'Status',
      dataIndex: 'password',
      align: 'center',
      render: (v?: string) =>
        v ? <Tag color="success">Active</Tag> : <Tag color="warning">No Password</Tag>,
    },
    {
      title: 'Actions',
      align: 'center',
      render: (_, record) => (
        <>
          <Button size="small" type="primary" onClick={() => openEdit(record)} style={{ marginRight: 6 }}>
            ✏ Edit
          </Button>
          <Button size="small" danger onClick={() => askDelete(record.name)}>
            🗑 Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <SendoLegacyPage title="Employee List">
      <div className="sendo-toolbar" style={{ display: 'flex', gap: 10, padding: '14px 16px', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <Button type="primary" onClick={downloadCSV}>⬇ Download CSV</Button>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#555' }}>
          {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <Table<Employee>
          rowKey={(r) => r._id ?? r.name}
          loading={employees.isLoading}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{ emptyText: 'No employees found' }}
        />
      </div>

      <Modal
        title={`Edit ${editing?.name}`}
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={saveEdit}
        okText="Save"
        confirmLoading={update.isPending}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>Name</div>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>Password</div>
            <Input
              value={editForm.password ?? ''}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>Role</div>
            <Input
              value={editForm.role ?? ''}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>Phone</div>
            <Input
              value={editForm.phone ?? ''}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>Email</div>
            <Input
              value={editForm.email ?? ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </SendoLegacyPage>
  );
}
