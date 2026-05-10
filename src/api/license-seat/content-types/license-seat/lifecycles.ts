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

  const password = typeof data.setPassword === 'string' ? data.setPassword.trim() : '';
  data.setPassword = null;
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
