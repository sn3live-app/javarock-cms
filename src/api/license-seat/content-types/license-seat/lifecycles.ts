import { hashPassword } from '../../../../utils/password';

type LifecycleEvent = {
  params: {
    data?: Record<string, unknown>;
  };
};

function applyPasswordHash(data: Record<string, unknown> | undefined) {
  if (!data) {
    return;
  }

  const resetPassword = typeof data.resetPassword === 'string' ? data.resetPassword.trim() : '';
  const password = resetPassword || (typeof data.password === 'string' ? data.password.trim() : '');

  data.password = null;
  data.resetPassword = null;

  if (password.length > 0) {
    data.passwordHash = hashPassword(password);
  }
}

export default {
  beforeCreate(event: LifecycleEvent) {
    applyPasswordHash(event.params.data);
  },

  beforeUpdate(event: LifecycleEvent) {
    applyPasswordHash(event.params.data);
  },
};
