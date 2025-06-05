import { Router } from 'express';
import { IncidentController } from '../controllers/incident.controller';

export function createIncidentRoutes(controller: IncidentController): Router {
  const router = Router();

  router.post('/', controller.create.bind(controller));
  router.get('/', controller.list.bind(controller));
  router.get('/:id', controller.getById.bind(controller));
  router.put('/:id', controller.update.bind(controller));
  router.delete('/:id', controller.remove.bind(controller));

  return router;
}
