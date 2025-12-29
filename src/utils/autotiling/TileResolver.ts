// src/utils/autotiling/TileResolver.ts
import { 
  AutotilingTexture, 
  AutotilingVariant, 
  TileType,
  TilesetRegistry,
  RuntimeTexture
} from '../../types/textures';
import { NeighborContext } from './NeighborAnalyzer';
import { WallTileResolver } from './WallTileResolver';

export class TileResolver {
  private wallResolver: WallTileResolver;

  constructor() {
    this.wallResolver = new WallTileResolver();
  }

  /**
   * Resolves the appropriate texture based on neighbor connectivity
   */
  resolveTileTexture(context: NeighborContext, tileType: TileType): AutotilingTexture | null {
    // Handle wall tiles with specialized resolver
    if (tileType === "wall") {
      return this.wallResolver.resolveWallTile(context);
    }

    // Get the primary tileset for this tile type
    const tilesetId = this.getPrimaryTilesetId(tileType);
    if (!tilesetId) {
      console.warn(`No tileset available for tile type: ${tileType}`);
      return null;
    }

    // Find the best matching texture based on connectivity pattern
    return this.findBestMatch(context, tilesetId, tileType);
  }

  /**
   * Finds the best matching texture for the given connectivity context
   */
  private findBestMatch(context: NeighborContext, tilesetId: string, tileType: TileType): AutotilingTexture {
    const { cardinalConnections, diagonalConnections } = context;
    
    // Count cardinal connections
    const cardinalCount = Object.values(cardinalConnections).filter(Boolean).length;
    
    // Determine the appropriate variant based on connection pattern
    const variant = this.determineVariant(cardinalConnections, diagonalConnections, cardinalCount);
    
    // Get texture from tileset registry with automatic fallback
    let matchingTexture = TilesetRegistry.getTexture(tilesetId, variant);
    
    // If not found, try common fallbacks
    if (!matchingTexture) {
      const fallbacks = [AutotilingVariant.CENTER, AutotilingVariant.SINGLE];
      for (const fallback of fallbacks) {
        matchingTexture = TilesetRegistry.getTexture(tilesetId, fallback);
        if (matchingTexture) break;
      }
    }
    
    // If still not found, use the tileset's default fallback
    if (!matchingTexture) {
      const tileset = TilesetRegistry.getTileset(tilesetId);
      if (tileset) {
        matchingTexture = TilesetRegistry.getTexture(tilesetId, tileset.fallbackVariant as any);
      }
    }
    
    return matchingTexture || this.createEmptyTexture(tileType);
  }

  /**
   * Creates a basic empty texture as final fallback
   */
  private createEmptyTexture(tileType: TileType): RuntimeTexture {
    return {
      id: `fallback_${tileType}`,
      name: `Fallback ${tileType}`,
      image_url: '',
      tileType: tileType,
      variant: AutotilingVariant.SINGLE,
      connectivityMask: 0,
      loaded: false
    };
  }

  /**
   * Gets the primary tileset ID for a tile type
   */
  private getPrimaryTilesetId(tileType: TileType): string | null {
    const tilesets = TilesetRegistry.getTilesetsForType(tileType);
    return tilesets.length > 0 ? tilesets[0].id : null;
  }

  /**
   * Determines the appropriate autotiling variant based on connections
   */
  private determineVariant(
    cardinal: { N: boolean; E: boolean; S: boolean; W: boolean },
    diagonal: { NE: boolean; SE: boolean; SW: boolean; NW: boolean },
    cardinalCount: number
  ): AutotilingVariant {
    
    switch (cardinalCount) {
      case 0:
        return AutotilingVariant.SINGLE;
        
      case 1:
        // Single cardinal connection - edge
        if (cardinal.N) return AutotilingVariant.EDGE_BOTTOM;
        if (cardinal.E) return AutotilingVariant.EDGE_LEFT;
        if (cardinal.S) return AutotilingVariant.EDGE_TOP;
        if (cardinal.W) return AutotilingVariant.EDGE_RIGHT;
        break;
        
      case 2:
        // Two cardinal connections
        if (cardinal.N && cardinal.S) {
          // Vertical connection
          return AutotilingVariant.VERTICAL;
        }
        if (cardinal.E && cardinal.W) {
          // Horizontal connection
          return AutotilingVariant.HORIZONTAL;
        }
        
        // Adjacent connections - external corners
        if (cardinal.N && cardinal.E) return AutotilingVariant.CORNER_BL;
        if (cardinal.E && cardinal.S) return AutotilingVariant.CORNER_TL;
        if (cardinal.S && cardinal.W) return AutotilingVariant.CORNER_TR;
        if (cardinal.W && cardinal.N) return AutotilingVariant.CORNER_BR;
        break;
        
      case 3:
        // Three cardinal connections - T-junctions
        if (!cardinal.N) return AutotilingVariant.T_TOP;
        if (!cardinal.E) return AutotilingVariant.T_RIGHT;
        if (!cardinal.S) return AutotilingVariant.T_BOTTOM;
        if (!cardinal.W) return AutotilingVariant.T_LEFT;
        break;
        
      case 4:
        // All cardinal connections - center or internal corners
        // Check for missing diagonal connections (internal corners)
        if (!diagonal.NW && cardinal.N && cardinal.W) return AutotilingVariant.INNER_TL;
        if (!diagonal.NE && cardinal.N && cardinal.E) return AutotilingVariant.INNER_TR;
        if (!diagonal.SW && cardinal.S && cardinal.W) return AutotilingVariant.INNER_BL;
        if (!diagonal.SE && cardinal.S && cardinal.E) return AutotilingVariant.INNER_BR;
        
        // All connections present
        return AutotilingVariant.CENTER;
    }
    
    // Default fallback
    return AutotilingVariant.CENTER;
  }

  /**
   * Gets all available textures for a tile type (backwards compatibility)
   */
  getTexturesForType(tileType: TileType): AutotilingTexture[] {
    const tilesets = TilesetRegistry.getTilesetsForType(tileType);
    const textures: AutotilingTexture[] = [];
    
    for (const tileset of tilesets) {
      const tilesetTextures = TilesetRegistry.getAllTexturesForTileset(tileset.id);
      textures.push(...tilesetTextures);
    }
    
    return textures;
  }

  /**
   * Gets texture by ID (backwards compatibility)
   */
  getTextureById(textureId: string): AutotilingTexture | undefined {
    // Try to parse tileset and variant from ID
    const parts = textureId.split('_');
    if (parts.length >= 2) {
      const tilesetId = parts[0];
      const variant = parts.slice(1).join('_');
      
      // Try to get from registry
      const texture = TilesetRegistry.getTexture(tilesetId, variant as any);
      if (texture) {
        return texture;
      }
    }

    // Fallback: search through all tilesets
    const allTilesets = TilesetRegistry.getAllTilesets();
    for (const tileset of allTilesets) {
      const textures = TilesetRegistry.getAllTexturesForTileset(tileset.id);
      const found = textures.find(t => t.id === textureId);
      if (found) return found;
    }
    
    return undefined;
  }
}