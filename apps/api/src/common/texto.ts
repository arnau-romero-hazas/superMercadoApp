export const texto = {
  normalizar: (valor: string): string =>
    valor
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim(),
  escaparRegex: (valor: string): string => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
};
