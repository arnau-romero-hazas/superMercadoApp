import { requisitosPassword } from '@super/shared';

export type RequisitoEvaluado = { texto: string; cumple: boolean };

const evaluar = (valor: string): RequisitoEvaluado[] =>
  requisitosPassword.map((requisito) => ({ texto: requisito.texto, cumple: requisito.patron.test(valor) }));

export const seguridadPassword = {
  evaluar,
  esSegura: (valor: string): boolean => evaluar(valor).every((requisito) => requisito.cumple),
  coinciden: (valor: string, repetida: string): boolean => repetida !== '' && valor === repetida,
};
