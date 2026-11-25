import { registroSchema } from '@super/shared';
import { describe, expect, it } from 'vitest';
import { seguridadPassword } from '@/logica/password';

describe('seguridadPassword', () => {
  it('marca cada requisito según se cumple', () => {
    expect(seguridadPassword.evaluar('abc').map((requisito) => requisito.cumple)).toEqual([false, false, true, false, false]);
    expect(seguridadPassword.evaluar('Abcdefg1!').map((requisito) => requisito.cumple)).toEqual([true, true, true, true, true]);
  });

  it('acepta letras con tilde y la ñ', () => {
    expect(seguridadPassword.esSegura('Ñandú2026?')).toBe(true);
  });

  it('no da por segura una contraseña sin símbolo', () => {
    expect(seguridadPassword.esSegura('Abcdefg12')).toBe(false);
  });

  it('solo considera que coinciden si la repetida no está vacía y es igual', () => {
    expect(seguridadPassword.coinciden('', '')).toBe(false);
    expect(seguridadPassword.coinciden('Abcdefg1!', 'Abcdefg1')).toBe(false);
    expect(seguridadPassword.coinciden('Abcdefg1!', 'Abcdefg1!')).toBe(true);
  });

  it('el servidor rechaza una contraseña débil con un mensaje claro', () => {
    const resultado = registroSchema.safeParse({ nombre: 'Ana', email: 'ana@ejemplo.com', password: 'abcdefgh' });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe('La contraseña debe tener una mayúscula');
  });
});
