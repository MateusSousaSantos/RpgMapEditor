// src/utils/autotiling/TileResolver.ts
import { 
  AutotilingTexture, 
  AutotilingVariant, 
  GRASS_AUTOTILING_TEXTURES,
  WATER_AUTOTILING_TEXTURES,
  TileType,
  DIRECTION_MASKS
} from '../../types/textures';
import { NeighborContext } from './NeighborAnalyzer';

export class TileResolver {
  private textureCache: Map<TileType, AutotilingTexture[]>;

  constructor() {
    this.textureCache = new Map();
    this.buildTextureCache();
  }

  /**
   * Resolves the appropriate texture based on neighbor connectivity
   */
  resolveTileTexture(context: NeighborContext, tileType: TileType): AutotilingTexture | null {
    const textures = this.textureCache.get(tileType);
    if (!textures) return null;

    // Find the best matching texture based on connectivity pattern
    return this.findBestMatch(context, textures);
  }

  /**
   * Finds the best matching texture for the given connectivity context
   */
  private findBestMatch(context: NeighborContext, textures: AutotilingTexture[]): AutotilingTexture {
    const { cardinalConnections, diagonalConnections } = context;
    
    // Count cardinal connections
    const cardinalCount = Object.values(cardinalConnections).filter(Boolean).length;
    
    // Determine the appropriate variant based on connection pattern
    const variant = this.determineVariant(cardinalConnections, diagonalConnections, cardinalCount);
    
    // Find texture with matching variant
    let matchingTexture = textures.find(texture => texture.variant === variant);
    
    // Fallback to center if no exact match found
    if (!matchingTexture) {
      matchingTexture = textures.find(texture => texture.variant === AutotilingVariant.CENTER)
        || textures.find(texture => texture.variant === AutotilingVariant.SINGLE)
        || textures[0];
    }
    
    return matchingTexture!;
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
   * Builds the texture cache organized by tile type
   */
  private buildTextureCache(): void {
    // Group all texture types
    const allTextures = [
      ...GRASS_AUTOTILING_TEXTURES,
      ...WATER_AUTOTILING_TEXTURES
    ];
    
    allTextures.forEach(texture => {
      if (!this.textureCache.has(texture.tileType as TileType)) {
        this.textureCache.set(texture.tileType as TileType, []);
      }
      this.textureCache.get(texture.tileType as TileType)!.push(texture);
    });
  }

  /**
   * Gets all available textures for a tile type
   */
  getTexturesForType(tileType: TileType): AutotilingTexture[] {
    return this.textureCache.get(tileType) || [];
  }

  /**
   * Gets texture by ID
   */
  getTextureById(textureId: string): AutotilingTexture | undefined {
    for (const textures of this.textureCache.values()) {
      const texture = textures.find(t => t.id === textureId);
      if (texture) return texture;
    }
    return undefined;
  }
}