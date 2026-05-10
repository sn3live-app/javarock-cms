import { hashPassword } from '../../../../utils/password';

type LifecycleEvent = {
  params: {
    data?: Record<string, unknown>;
  };
};

function applyPasswordHash(data: Record<string, unknown> | undefined) {
  if (!data || typeof data.password !== 'string') {
    return;
  }

  const password = data.password.trim();
  data.password = null;

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
