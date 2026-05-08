import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Modal, Tag } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from '../employees.hooks';

const ADMIN_PASS = 'admin123';

export default function EmployeePasswordsPage(): JSX.Element {
  const employees = useEmployees();
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();

  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [commonPass, setCommonPass] = useState<string>('sendo123');
  const [commonInput, setCommonInput] = useState<string>('');
  const [commonSaved, setCommonSaved] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, string> = {};
    (employees.data ?? []).forEach((e) => {
      if (e.password) map[e.name] = e.password;
    });
    setPasswords(map);
  }, [employees.data]);

  const filtered = useMemo(
    () =>
      (employees.data ?? []).filter((e) =>
        (e.name || '').toLowerCase().includes(search.toLowerCase()),
      ),
    [employees.data, search],
  );

  const handleSaveCommon = (): void => {
    const next = commonInput.trim();
    if (!next) {
      Modal.warning({ title: 'Enter a password' });
      return;
    }
    setCommonPass(next);
    setCommonInput('');
    setCommonSaved(true);
    setTimeout(() => setCommonSaved(false), 3000);
  };

  const handleSavePass = (name: string): void => {
    setSavingId(name);
    update.mutate(
      { name, body: { password: passwords[name] || '' } },
      { onSettled: () => setSavingId(null) },
    );
  };

  const handleAddEmployee = (): void => {
    const n = newName.trim().toUpperCase();
    if (!n) return;
    create.mutate(
      { name: n, password: newPass.trim() },
      {
        onSuccess: () => {
          setNewName('');
          setNewPass('');
        },
      },
    );
  };

  const handleDelete = (name: string): void => {
    Modal.confirm({
      title: `Remove employee "${name}"?`,
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(name),
    });
  };

  return (
    <SendoLegacyPage title="Employee Passwords">
      <div style={{ padding: 20 }}>
        <Card style={{ marginBottom: 16 }}>
          <div
            style={{
              background: '#fff8e1',
              border: '1px solid #f59e0b',
              borderRadius: 6,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            💡 <strong>Admin password</strong>: <code>{ADMIN_PASS}</code>
          </div>
          <div
            style={{
              background: '#e3f2fd',
              border: '1px solid #1565c0',
              borderRadius: 6,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            🔑 Common employee password: <code>{commonPass}</code>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>
            Change Common Employee Password
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="New common password..."
              value={commonInput}
              onChange={(e) => setCommonInput(e.target.value)}
              onPressEnter={handleSaveCommon}
              style={{ width: 240 }}
            />
            <Button type="primary" onClick={handleSaveCommon}>✅ Set Password</Button>
            {commonSaved && (
              <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: 13 }}>
                ✅ Common password updated to <strong>{commonPass}</strong>
              </span>
            )}
          </div>
        </Card>

        <Card title="➕ Add New Employee" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input
              placeholder="Employee name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={handleAddEmployee}
              style={{ minWidth: 180 }}
            />
            <Input
              placeholder="Password..."
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              onPressEnter={handleAddEmployee}
              style={{ width: 160 }}
            />
            <Button type="primary" onClick={handleAddEmployee} loading={create.isPending}>
              ➕ Add
            </Button>
          </div>
        </Card>

        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 'bold' }}>
                👤 Employees{' '}
                <Tag color="processing">{employees.data?.length ?? 0}</Tag>
              </div>
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
            </div>
          }
        >
          {employees.isLoading ? (
            <p style={{ color: '#888' }}>Loading employees...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#888' }}>No employees found.</p>
          ) : (
            filtered.map((emp, i) => {
              const hasPw = !!(passwords[emp.name] || emp.password);
              return (
                <div
                  key={emp._id || emp.name}
                  style={{
                    background: '#fafafa',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(56,189,248,0.1)',
                        border: '1px solid rgba(56,189,248,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#1565c0',
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, fontWeight: 'bold', fontSize: 13 }}>{emp.name}</div>
                    {hasPw ? (
                      <Tag color="success">🔒 Password Set</Tag>
                    ) : (
                      <Tag color="warning">⚠️ No Password</Tag>
                    )}
                    <Button danger size="small" onClick={() => handleDelete(emp.name)}>✕</Button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, padding: '0 14px 10px 58px' }}>
                    <Input
                      placeholder="Set password..."
                      value={passwords[emp.name] || ''}
                      onChange={(e) =>
                        setPasswords({ ...passwords, [emp.name]: e.target.value })
                      }
                      onPressEnter={() => handleSavePass(emp.name)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleSavePass(emp.name)}
                      loading={savingId === emp.name}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </SendoLegacyPage>
  );
}
