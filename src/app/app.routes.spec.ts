import { CALCULADORAS } from './core/constants/calculadoras';
import { routes } from './app.routes';

describe('rutas', () => {
  it('cada calculadora tiene una ruta con título, descripción y componente que carga', async () => {
    for (const c of CALCULADORAS) {
      const ruta = routes.find((r) => r.path === c.ruta);
      expect(ruta, c.ruta).toBeDefined();
      expect(ruta?.title).toContain(c.titulo);
      expect(typeof ruta?.data?.['description']).toBe('string');
      const componente = await (ruta?.loadComponent as () => Promise<unknown>)();
      expect(componente).toBeTruthy();
    }
  });

  it('incluye la página de inicio y una ruta comodín para el 404 al final', () => {
    expect(routes[0].path).toBe('');
    expect(routes.at(-1)?.path).toBe('**');
  });
});
