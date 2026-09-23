import Dexie, { type EntityTable } from 'dexie';
import type { Artwork, Exhibition, GalleryRoom, GuideAnnotation, VisitorLog, VisitSession } from '../types';

export class GalleryDatabase extends Dexie {
  rooms!: EntityTable<GalleryRoom, 'id'>;
  artworks!: EntityTable<Artwork, 'id'>;
  exhibitions!: EntityTable<Exhibition, 'id'>;
  annotations!: EntityTable<GuideAnnotation, 'id'>;
  visitors!: EntityTable<VisitorLog, 'visitorId'>;
  visitSessions!: EntityTable<VisitSession, 'id'>;

  constructor() {
    super('virtual-gallery-tour');
    this.version(1).stores({
      rooms: 'id, roomType',
      artworks: 'id, roomId, artistName',
      exhibitions: 'id, status',
      annotations: 'id, artworkId',
      visitors: 'visitorId, currentRoomId, onlineStatus',
    });
    this.version(2).stores({
      visitSessions: 'id, visitorId, enteredAt, onlineStatus',
    });
  }
}

export const db = new GalleryDatabase();
