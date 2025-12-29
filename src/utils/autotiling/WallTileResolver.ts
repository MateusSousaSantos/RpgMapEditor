// src/utils/autotiling/WallTileResolver.ts
import {
    AutotilingTexture,
    WallTilingVariant,
    TilesetRegistry
} from '../../types/textures';
import { NeighborContext } from './NeighborAnalyzer';

/**
 * WallTileResolver handles autotiling logic for wall tiles.
 * Walls blend with adjacent walls based on orthogonal connectivity (N, S, E, W).
 * The 24+ wall variants represent different positional configurations.
 *
 * Variant Mapping Logic:
 * - No connections (0): Isolated wall - uses single variant
 * - 1 connection: Edge wall - uses direction-specific variants
 * - 2 connections (opposite): Straight lines - uses horizontal/vertical variants
 * - 2 connections (adjacent): Corner positions - uses corner variants
 * - 3 connections: T-junctions - uses t_* variants
 * - 4 connections: Cross - uses cross or full variants
 */
export class WallTileResolver {
    private getWallTilesetId(): string | null {
        const wallTilesets = TilesetRegistry.getTilesetsForType("wall");
        return wallTilesets.length > 0 ? wallTilesets[0].id : null;
    }

    /**
     * Resolves the appropriate wall tile texture based on neighbor connectivity
     */
    resolveWallTile(context: NeighborContext): AutotilingTexture | null {
        const tilesetId = this.getWallTilesetId();
        if (!tilesetId) {
            console.warn('No wall tileset available');
            return null;
        }

        const variant = this.determineWallVariant(context);
        let texture = TilesetRegistry.getTexture(tilesetId, variant);
        
        // If variant not found, try fallback
        if (!texture) {
            const tileset = TilesetRegistry.getTileset(tilesetId);
            if (tileset) {
                texture = TilesetRegistry.getTexture(tilesetId, tileset.fallbackVariant as any);
            }
        }
        
        if (!texture) {
            console.warn(`No texture found for wall variant ${variant} at (${context.center.row}, ${context.center.col})`);
        }
        
        return texture;
    }

    /**
     * Determines the wall variant based on orthogonal and diagonal neighbor connectivity
     * Corner variants (full_top_left, etc.) are only selected when:
     * - Both cardinal neighbors in that corner are present
     * - The diagonal neighbor in that corner is also present
     */
    private determineWallVariant(context: NeighborContext): WallTilingVariant {
        const { cardinalConnections, diagonalConnections } = context;
        const { N, S, E, W } = cardinalConnections;
        const { NE, SE, SW, NW } = diagonalConnections;

        // Count cardinal connections
        const connectionCount = [N, S, E, W].filter(Boolean).length;

        switch (connectionCount) {
            case 0:
                // Isolated wall - no adjacent walls on any cardinal direction
                return WallTilingVariant.SINGLE;

            case 1:
                // Single edge - wall extends in one direction only
                if (N) {
                    // Wall only connected above (north)
                    return WallTilingVariant.BOTTOM_VERTICAL_EDGE;
                } else if (S) {
                    // Wall only connected below (south)
                    return WallTilingVariant.TOP_VERTICAL_EDGE;
                } else if (E) {
                    // Wall only connected to the right (east)
                    return WallTilingVariant.LEFT_HORIZONTAL_EDGE;
                } else if (W) {
                    // Wall only connected to the left (west)
                    return WallTilingVariant.RIGHT_HORIZONTAL_EDGE;
                }
                break;

            case 2:
                // Two connections - either opposite (straight line) or adjacent (corner)
                if ((N && S) || (E && W)) {
                    // Opposite connections - straight line through the tile
                    if (N && S) {
                        // Wall connected vertically (top and bottom)
                        return WallTilingVariant.VERTICAL;
                    } else if (E && W) {
                        // Wall connected horizontally (left and right)
                        return WallTilingVariant.HORIZONTAL;
                    }
                } else {
                    // Adjacent connections - corner configuration
                    if (N && E) {
                        // Wall in top-right corner
                        if (NE) {
                            // Diagonal (northeast) also has wall - full corner
                            return WallTilingVariant.FULL_BOTTOM_LEFT;
                        } else {
                            // Diagonal is empty - open corner
                            return WallTilingVariant.BOTTOM_LEFT;
                        }
                    } else if (N && W) {
                        // Wall in top-left corner
                        if (NW) {
                            // Diagonal (northwest) also has wall - full corner
                            return WallTilingVariant.FULL_BOTTOM_RIGHT;
                        } else {
                            // Diagonal is empty - open corner
                            return WallTilingVariant.BOTTOM_RIGHT;
                        }
                    } else if (S && E) {
                        // Wall in bottom-right corner
                        if (SE) {
                            // Diagonal (southeast) also has wall - full corner
                            return WallTilingVariant.FULL_TOP_LEFT;
                        } else {
                            // Diagonal is empty - open corner
                            return WallTilingVariant.TOP_LEFT;
                        }
                    } else if (S && W) {
                        // Wall in bottom-left corner
                        if (SW) {
                            // Diagonal (southwest) also has wall - full corner
                            return WallTilingVariant.FULL_TOP_RIGHT;
                        } else {
                            // Diagonal is empty - open corner
                            return WallTilingVariant.TOP_RIGHT;
                        }
                    }
                }
                break;

            case 3:
                // Three connections - T-junction with one open side
                if (!N) {
                    // Open to top - connections on south, east, and west
                    if (SW) {
                        if (!SE) {
                            return WallTilingVariant.FULL_T_LEFT_TOP;
                        }
                        // Both diagonal corners at bottom have walls - full T bottom
                        return WallTilingVariant.FULL_TOP_CENTER;
                    }
                    else {
                        if(SE){
                            return WallTilingVariant.FULL_T_RIGHT_TOP;
                        }
                        // Regular T-junction opening upward
                        return WallTilingVariant.T_TOP;
                    }
                } else if (!S) {
                    // Open to bottom - connections on north, east, and west
                    if (NE) {
                        if (!NW) {
                            return WallTilingVariant.FULL_T_RIGHT_BOTTOM;
                        }
                        // Both diagonal corners at top have walls - full T top
                        return WallTilingVariant.FULL_BOTTOM_CENTER;
                    } else {
                        if(NW){
                            return WallTilingVariant.FULL_T_LEFT_BOTTOM;
                        }
                        // Regular T-junction opening downward
                        return WallTilingVariant.T_BOTTOM;
                    }
                } else if (!E) {
                    // Open to right - connections on north, south, and west
                    if (NW) {
                        if (!SW) {
                            return WallTilingVariant.FULL_T_TOP_LEFT;
                        }
                        // Both diagonal corners on left have walls - full T left
                        return WallTilingVariant.FULL_CENTER_RIGHT;
                    } else {
                        if(SW){
                            return WallTilingVariant.FULL_T_BOTTOM_LEFT;
                        }
                        // Regular T-junction opening rightward
                        return WallTilingVariant.T_RIGHT;
                    }
                } else if (!W) {
                    // Open to left - connections on north, south, and east
                    if (NE) {
                        // Both diagonal corners on right have walls - full T right
                        if (!SE) {
                            return WallTilingVariant.FULL_T_TOP_RIGHT;
                        }
                        return WallTilingVariant.FULL_CENTER_LEFT;
                    }
                    else {
                        // Regular T-junction opening leftward
                        if(SE){
                            return WallTilingVariant.FULL_T_BOTTOM_RIGHT;
                        }
                        return WallTilingVariant.T_LEFT;
                    }
                }
                break;

            case 4:
                // All four cardinal connections - cross/intersection
                // Check which diagonals have walls
                const diagonalCount = [NE, SE, SW, NW].filter(Boolean).length;

                if (diagonalCount === 4) {
                    // All four diagonal corners have walls - fully enclosed center
                    return WallTilingVariant.FULL_CENTER;
                } else if (diagonalCount === 3) {
                    // Three diagonal corners have walls - check which one is missing
                    if (!NE) {
                        // Missing northeast diagonal - full top-left corner
                        return WallTilingVariant.FULL_TOP_LEFT_CORNER;
                    } else if (!SE) {
                        // Missing southeast diagonal - full top-right corner
                        return WallTilingVariant.FULL_BOTTOM_RIGHT_CORNER;
                    } else if (!SW) {
                        // Missing southwest diagonal - full bottom-right corner
                        return WallTilingVariant.FULL_BOTTOM_LEFT_CORNER;
                    } else if (!NW) {
                        // Missing northwest diagonal - full bottom-left corner
                        return WallTilingVariant.FULL_TOP_RIGHT_CORNER;
                    }
                } else if (diagonalCount === 2) {
                    // Two diagonal corners have walls - check which pair
                    if (NE && SE) {
                        // Right side diagonals (northeast and southeast)
                        return WallTilingVariant.FULL_T_RIGHT_TOP_BOTTOM;
                    } else if (SE && SW) {
                        // Bottom side diagonals (southeast and southwest)
                        return WallTilingVariant.FULL_T_BOTTOM_RIGHT_LEFT;
                    } else if (SW && NW) {
                        // Left side diagonals (southwest and northwest)
                        return WallTilingVariant.FULL_T_LEFT_TOP_BOTTOM;
                    } else if (NW && NE) {
                        // Top side diagonals (northwest and northeast)
                        return WallTilingVariant.FULL_T_TOP_RIGHT_LEFT;
                    } else if (NE && SW) {
                        // Opposite diagonals (northeast and southwest)
                        return WallTilingVariant.FULL_CROSS_TOP_RIGHT_BOTTOM_LEFT;
                    } else if (SE && NW) {
                        // Opposite diagonals (southeast and northwest)
                        return WallTilingVariant.FULL_CROSS_TOP_LEFT_BOTTOM_RIGHT;
                    }
                }
                else if (diagonalCount === 1) {
                    // One diagonal corner has a wall - return corresponding full corner variant
                    if (NE) {
                        return WallTilingVariant.FULL_CROSS_TOP_RIGHT;
                    } else if (SE) {
                        return WallTilingVariant.FULL_CROSS_BOTTOM_RIGHT;
                    } else if (SW) {
                        return WallTilingVariant.FULL_CROSS_BOTTOM_LEFT;
                    } else if (NW) {
                        return WallTilingVariant.FULL_CROSS_TOP_LEFT;
                    }   
                }
                
                else {

                    // Not all diagonals have walls - regular cross intersection
                    return WallTilingVariant.CROSS;
                }
                break;
        }

        // Default fallback for any unexpected case
        return WallTilingVariant.SINGLE;
    }
}
