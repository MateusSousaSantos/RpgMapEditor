// src/types/textures.ts

// Basic texture interface
export interface Texture {
    id: string;
    name: string;
    image_url: string;
}

// Enhanced autotiling texture interface
export interface AutotilingTexture {
    id: string;
    name: string;
    image_url: string;
    tileType: string;
    variant: AutotilingVariant | WallTilingVariant;
    connectivityMask: number; // Bitmask representing required connections
}

// Tileset definition interface for dynamic loading
export interface TilesetDefinition {
    id: string;
    name: string;
    theme: string;
    tileType: TileType;
    baseDir: string;
    fallbackVariant: string; // Default variant to use when specific variant is missing
    components: TilesetComponent[];
}

// Component definition for each tileset variant
export interface TilesetComponent {
    variant: AutotilingVariant | WallTilingVariant;
    filename: string;
    required: boolean;
    connectivityMask: number;
}

// Runtime texture cache entry
export interface RuntimeTexture extends AutotilingTexture {
    loaded: boolean;
    imageElement?: HTMLImageElement;
}

// Autotiling variants based on 8-neighbor connectivity
export const AutotilingVariant = {
    // Single tile (no connections)
    SINGLE: "single",

    // Straight edges
    EDGE_TOP: "edge_top",
    EDGE_RIGHT: "edge_right",
    EDGE_BOTTOM: "edge_bottom",
    EDGE_LEFT: "edge_left",

    // Corners (external)
    CORNER_TL: "corner_tl", // top-left external corner
    CORNER_TR: "corner_tr", // top-right external corner
    CORNER_BL: "corner_bl", // bottom-left external corner
    CORNER_BR: "corner_br", // bottom-right external corner

    // Internal corners
    INNER_TL: "inner_tl", // top-left internal corner
    INNER_TR: "inner_tr", // top-right internal corner
    INNER_BL: "inner_bl", // bottom-left internal corner
    INNER_BR: "inner_br", // bottom-right internal corner

    // Straights (connected on opposite sides)
    HORIZONTAL: "horizontal", // left-right connection
    VERTICAL: "vertical",     // top-bottom connection

    // T-junctions
    T_TOP: "t_top",       // connections from bottom, left, right
    T_RIGHT: "t_right",   // connections from left, top, bottom
    T_BOTTOM: "t_bottom", // connections from top, left, right
    T_LEFT: "t_left",     // connections from right, top, bottom

    // Center (connected in all 4 cardinal directions)
    CENTER: "center"
} as const;

export type AutotilingVariant = typeof AutotilingVariant[keyof typeof AutotilingVariant];

// Wall tiling variants (positional variants for wall structures)
export const WallTilingVariant = {
    BOTTOM_LEFT: "bottom_left",
    BOTTOM_RIGHT: "bottom_right",
    BOTTOM_VERTICAL_EDGE: "bottom_vertical_edge",

    CROSS: "cross",
    FULL_CROSS_TOP_LEFT: "full_cross_top_left",
    FULL_CROSS_TOP_RIGHT: "full_cross_top_right",
    FULL_CROSS_BOTTOM_LEFT: "full_cross_bottom_left",
    FULL_CROSS_BOTTOM_RIGHT: "full_cross_bottom_right",

    FULL_CROSS_TOP_LEFT_BOTTOM_RIGHT: "full_cross_top_left_bottom_right",
    FULL_CROSS_TOP_RIGHT_BOTTOM_LEFT: "full_cross_top_right_bottom_left",

    FULL_BOTTOM_CENTER: "full_bottom_center",
    FULL_BOTTOM_LEFT: "full_bottom_left",
    FULL_BOTTOM_LEFT_CORNER: "full_bottom_left_corner",
    FULL_BOTTOM_RIGHT: "full_bottom_right",
    FULL_BOTTOM_RIGHT_CORNER: "full_bottom_right_corner",
    FULL_CENTER: "full_center",
    FULL_CENTER_LEFT: "full_center_left",
    FULL_CENTER_RIGHT: "full_center_right",
    FULL_TOP_CENTER: "full_top_center",
    FULL_TOP_LEFT: "full_top_left",
    FULL_TOP_LEFT_CORNER: "full_top_left_corner",
    FULL_TOP_RIGHT: "full_top_right",
    FULL_TOP_RIGHT_CORNER: "full_top_right_corner",
    
    FULL_T_BOTTOM_LEFT: "full_t_bottom_left",
    FULL_T_BOTTOM_RIGHT: "full_t_bottom_right",
    FULL_T_BOTTOM_RIGHT_LEFT: "full_t_bottom_right_left",
    FULL_T_LEFT_BOTTOM: "full_t_left_bottom",
    FULL_T_LEFT_TOP: "full_t_left_top",
    FULL_T_LEFT_TOP_BOTTOM: "full_t_left_top_bottom",
    FULL_T_RIGHT_BOTTOM: "full_t_right_bottom",
    FULL_T_RIGHT_TOP: "full_t_right_top",
    FULL_T_RIGHT_TOP_BOTTOM: "full_t_right_top_bottom",
    FULL_T_TOP_LEFT: "full_t_top_left",
    FULL_T_TOP_RIGHT: "full_t_top_right",
    FULL_T_TOP_RIGHT_LEFT: "full_t_top_right_left",

    HORIZONTAL: "horizontal",
    LEFT_HORIZONTAL_EDGE: "left_horizontal_edge",
    RIGHT_HORIZONTAL_EDGE: "right_horizontal_edge",
    SINGLE: "single",
    T_BOTTOM: "t_bottom",
    T_LEFT: "t_left",  
    T_RIGHT: "t_right",
    T_TOP: "t_top",
    TOP_LEFT: "top_left",
    TOP_RIGHT: "top_right",
    TOP_VERTICAL_EDGE: "top_vertical_edge",
    VERTICAL: "vertical"
} as const;

export type WallTilingVariant = typeof WallTilingVariant[keyof typeof WallTilingVariant];

// Direction bitmask constants for 8-neighbor analysis
export const DIRECTION_MASKS = {
    N: 1 << 0,  // North (top)
    NE: 1 << 1,  // Northeast
    E: 1 << 2,  // East (right)
    SE: 1 << 3,  // Southeast
    S: 1 << 4,  // South (bottom)
    SW: 1 << 5,  // Southwest
    W: 1 << 6,  // West (left)
    NW: 1 << 7   // Northwest
} as const;

// Component templates defining standard variants for each tile type
export const STANDARD_AUTOTILING_COMPONENTS: TilesetComponent[] = [
    // Single isolated tile (required)
    { variant: AutotilingVariant.SINGLE, filename: "single.png", required: true, connectivityMask: 0 },

    // Straight edges (required)
    { variant: AutotilingVariant.EDGE_TOP, filename: "edge_top.png", required: true, connectivityMask: DIRECTION_MASKS.S },
    { variant: AutotilingVariant.EDGE_RIGHT, filename: "edge_right.png", required: true, connectivityMask: DIRECTION_MASKS.W },
    { variant: AutotilingVariant.EDGE_BOTTOM, filename: "edge_bottom.png", required: true, connectivityMask: DIRECTION_MASKS.N },
    { variant: AutotilingVariant.EDGE_LEFT, filename: "edge_left.png", required: true, connectivityMask: DIRECTION_MASKS.E },

    // External corners (required)
    { variant: AutotilingVariant.CORNER_TL, filename: "corner_tl.png", required: true, connectivityMask: DIRECTION_MASKS.S | DIRECTION_MASKS.E },
    { variant: AutotilingVariant.CORNER_TR, filename: "corner_tr.png", required: true, connectivityMask: DIRECTION_MASKS.S | DIRECTION_MASKS.W },
    { variant: AutotilingVariant.CORNER_BL, filename: "corner_bl.png", required: true, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E },
    { variant: AutotilingVariant.CORNER_BR, filename: "corner_br.png", required: true, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.W },

    // Internal corners (optional - can fallback to center)
    { variant: AutotilingVariant.INNER_TL, filename: "inner_tl.png", required: false, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W },
    { variant: AutotilingVariant.INNER_TR, filename: "inner_tr.png", required: false, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W },
    { variant: AutotilingVariant.INNER_BL, filename: "inner_bl.png", required: false, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W },
    { variant: AutotilingVariant.INNER_BR, filename: "inner_br.png", required: false, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W },

    // Straight connections (required)
    { variant: AutotilingVariant.HORIZONTAL, filename: "horizontal.png", required: true, connectivityMask: DIRECTION_MASKS.W | DIRECTION_MASKS.E },
    { variant: AutotilingVariant.VERTICAL, filename: "vertical.png", required: true, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.S },

    // T-junctions (required)
    { variant: AutotilingVariant.T_TOP, filename: "t_top.png", required: true, connectivityMask: DIRECTION_MASKS.S | DIRECTION_MASKS.W | DIRECTION_MASKS.E },
    { variant: AutotilingVariant.T_RIGHT, filename: "t_right.png", required: true, connectivityMask: DIRECTION_MASKS.W | DIRECTION_MASKS.N | DIRECTION_MASKS.S },
    { variant: AutotilingVariant.T_BOTTOM, filename: "t_bottom.png", required: true, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.W | DIRECTION_MASKS.E },
    { variant: AutotilingVariant.T_LEFT, filename: "t_left.png", required: true, connectivityMask: DIRECTION_MASKS.E | DIRECTION_MASKS.N | DIRECTION_MASKS.S },

    // Center (required)
    { variant: AutotilingVariant.CENTER, filename: "center.png", required: true, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W }
];

// Wall components template (comprehensive set for wall structures)
export const WALL_COMPONENTS: TilesetComponent[] = [
    // Basic wall variants (all required)
    { variant: WallTilingVariant.SINGLE, filename: "single.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.HORIZONTAL, filename: "horizontal.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.VERTICAL, filename: "vertical.png", required: true, connectivityMask: 0 },
    
    // Corner variants (required)
    { variant: WallTilingVariant.TOP_LEFT, filename: "top_left.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.TOP_RIGHT, filename: "top_right.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.BOTTOM_LEFT, filename: "bottom_left.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.BOTTOM_RIGHT, filename: "bottom_right.png", required: true, connectivityMask: 0 },
    
    // T-junction variants (required)
    { variant: WallTilingVariant.T_TOP, filename: "t_top.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.T_RIGHT, filename: "t_right.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.T_BOTTOM, filename: "t_bottom.png", required: true, connectivityMask: 0 },
    { variant: WallTilingVariant.T_LEFT, filename: "t_left.png", required: true, connectivityMask: 0 },
    
    // Cross variant (required)
    { variant: WallTilingVariant.CROSS, filename: "cross.png", required: true, connectivityMask: 0 },
    
    // Edge variants (optional)
    { variant: WallTilingVariant.TOP_VERTICAL_EDGE, filename: "top_vertical_edge.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.BOTTOM_VERTICAL_EDGE, filename: "bottom_vertical_edge.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.LEFT_HORIZONTAL_EDGE, filename: "left_horizontal_edge.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.RIGHT_HORIZONTAL_EDGE, filename: "right_horizontal_edge.png", required: false, connectivityMask: 0 },
    
    // Full variants (optional - advanced wall features)
    { variant: WallTilingVariant.FULL_CENTER, filename: "full_center.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_TOP_CENTER, filename: "full_top_center.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_BOTTOM_CENTER, filename: "full_bottom_center.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_CENTER_LEFT, filename: "full_center_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_CENTER_RIGHT, filename: "full_center_right.png", required: false, connectivityMask: 0 },
    
    // Full corner variants (optional)
    { variant: WallTilingVariant.FULL_TOP_LEFT, filename: "full_top_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_TOP_RIGHT, filename: "full_top_right.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_BOTTOM_LEFT, filename: "full_bottom_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_BOTTOM_RIGHT, filename: "full_bottom_right.png", required: false, connectivityMask: 0 },
    
    // Full corner edge variants (optional)
    { variant: WallTilingVariant.FULL_TOP_LEFT_CORNER, filename: "full_top_left_corner.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_TOP_RIGHT_CORNER, filename: "full_top_right_corner.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_BOTTOM_LEFT_CORNER, filename: "full_bottom_left_corner.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_BOTTOM_RIGHT_CORNER, filename: "full_bottom_right_corner.png", required: false, connectivityMask: 0 },
    
    // Full T-junction variants (optional)
    { variant: WallTilingVariant.FULL_T_TOP_LEFT, filename: "full_t_top_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_TOP_RIGHT, filename: "full_t_top_right.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_BOTTOM_LEFT, filename: "full_t_bottom_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_BOTTOM_RIGHT, filename: "full_t_bottom_right.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_LEFT_TOP, filename: "full_t_left_top.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_LEFT_BOTTOM, filename: "full_t_left_bottom.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_RIGHT_TOP, filename: "full_t_right_top.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_RIGHT_BOTTOM, filename: "full_t_right_bottom.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_TOP_RIGHT_LEFT, filename: "full_t_top_right_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_BOTTOM_RIGHT_LEFT, filename: "full_t_bottom_right_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_LEFT_TOP_BOTTOM, filename: "full_t_left_top_bottom.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_T_RIGHT_TOP_BOTTOM, filename: "full_t_right_top_bottom.png", required: false, connectivityMask: 0 },
    
    // Full cross variants (optional)
    { variant: WallTilingVariant.FULL_CROSS_TOP_LEFT, filename: "full_cross_top_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_CROSS_TOP_RIGHT, filename: "full_cross_top_right.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_CROSS_BOTTOM_LEFT, filename: "full_cross_bottom_left.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_CROSS_BOTTOM_RIGHT, filename: "full_cross_bottom_right.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_CROSS_TOP_LEFT_BOTTOM_RIGHT, filename: "full_cross_top_left_bottom_right.png", required: false, connectivityMask: 0 },
    { variant: WallTilingVariant.FULL_CROSS_TOP_RIGHT_BOTTOM_LEFT, filename: "full_cross_top_right_bottom_left.png", required: false, connectivityMask: 0 }
];

// Simple texture components for basic tile types (like water)
export const SIMPLE_COMPONENTS: TilesetComponent[] = [
    { variant: AutotilingVariant.SINGLE, filename: "single.png", required: true, connectivityMask: 0 }
];

// Default tileset definitions
export const DEFAULT_TILESETS: TilesetDefinition[] = [
    {
        id: "default_grass",
        name: "Default Grass",
        theme: "default",
        tileType: "grass",
        baseDir: "/assets/tilesets/default/grass",
        fallbackVariant: AutotilingVariant.SINGLE,
        components: STANDARD_AUTOTILING_COMPONENTS
    },
    {
        id: "default_water",
        name: "Default Water", 
        theme: "default",
        tileType: "water",
        baseDir: "/assets/tilesets/default/water",
        fallbackVariant: AutotilingVariant.SINGLE,
        components: SIMPLE_COMPONENTS
    },
    {
        id: "wood_walls",
        name: "Wood Walls",
        theme: "wood",
        tileType: "wall",
        baseDir: "/assets/walls/wood",
        fallbackVariant: WallTilingVariant.SINGLE,
        components: WALL_COMPONENTS
    }
];

// Tile types for autotiling system  
export type TileType = "grass" | "water" | "stone" | "wall" | "empty";

// Tileset registry for runtime management
export class TilesetRegistry {
    private static tilesets: Map<string, TilesetDefinition> = new Map();
    private static textureCache: Map<string, RuntimeTexture> = new Map();

    // Register a tileset definition
    static registerTileset(tileset: TilesetDefinition) {
        this.tilesets.set(tileset.id, tileset);
    }

    // Get all tilesets for a specific tile type
    static getTilesetsForType(tileType: TileType): TilesetDefinition[] {
        return Array.from(this.tilesets.values()).filter(t => t.tileType === tileType);
    }

    // Get a specific tileset by ID
    static getTileset(id: string): TilesetDefinition | undefined {
        return this.tilesets.get(id);
    }

    // Get all registered tilesets
    static getAllTilesets(): TilesetDefinition[] {
        return Array.from(this.tilesets.values());
    }

    // Generate runtime texture for a tileset variant
    static getTexture(tilesetId: string, variant: AutotilingVariant | WallTilingVariant): RuntimeTexture | null {
        const cacheKey = `${tilesetId}_${variant}`;
        const cached = this.textureCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const tileset = this.getTileset(tilesetId);
        if (!tileset) {
            return null;
        }

        // Find the component for this variant
        const component = tileset.components.find(c => c.variant === variant);
        
        // If variant not found, try to get fallback
        if (!component) {
            return this.getFallbackTexture(tilesetId, tileset.fallbackVariant as any);
        }

        // Create runtime texture
        const texture: RuntimeTexture = {
            id: `${tilesetId}_${variant}`,
            name: `${tileset.name} ${variant}`,
            image_url: `${tileset.baseDir}/${component.filename}`,
            tileType: tileset.tileType,
            variant: variant,
            connectivityMask: component.connectivityMask,
            loaded: false
        };

        this.textureCache.set(cacheKey, texture);
        return texture;
    }

    // Get fallback texture when variant is missing
    private static getFallbackTexture(tilesetId: string, fallbackVariant: AutotilingVariant | WallTilingVariant): RuntimeTexture | null {
        const cacheKey = `${tilesetId}_${fallbackVariant}`;
        const cached = this.textureCache.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const tileset = this.getTileset(tilesetId);
        if (!tileset) {
            return null;
        }

        const component = tileset.components.find(c => c.variant === fallbackVariant);
        if (!component) {
            console.warn(`Fallback variant ${fallbackVariant} not found in tileset ${tilesetId}`);
            return null;
        }

        const texture: RuntimeTexture = {
            id: `${tilesetId}_${fallbackVariant}`,
            name: `${tileset.name} ${fallbackVariant}`,
            image_url: `${tileset.baseDir}/${component.filename}`,
            tileType: tileset.tileType,
            variant: fallbackVariant,
            connectivityMask: component.connectivityMask,
            loaded: false
        };

        this.textureCache.set(cacheKey, texture);
        return texture;
    }

    // Get all textures for a tileset
    static getAllTexturesForTileset(tilesetId: string): RuntimeTexture[] {
        const tileset = this.getTileset(tilesetId);
        if (!tileset) {
            return [];
        }

        return tileset.components.map(component => {
            const existing = this.getTexture(tilesetId, component.variant);
            return existing || this.createTextureForComponent(tileset, component);
        }).filter((texture): texture is RuntimeTexture => texture !== null);
    }

    private static createTextureForComponent(tileset: TilesetDefinition, component: TilesetComponent): RuntimeTexture {
        return {
            id: `${tileset.id}_${component.variant}`,
            name: `${tileset.name} ${component.variant}`,
            image_url: `${tileset.baseDir}/${component.filename}`,
            tileType: tileset.tileType,
            variant: component.variant,
            connectivityMask: component.connectivityMask,
            loaded: false
        };
    }

    // Initialize default tilesets
    static initialize() {
        DEFAULT_TILESETS.forEach(tileset => {
            this.registerTileset(tileset);
        });
    }
}

// Helper function to get all textures for a specific tile type (backwards compatibility)
export const getTexturesForType = (tileType: TileType): AutotilingTexture[] => {
    const tilesets = TilesetRegistry.getTilesetsForType(tileType);
    
    if (tilesets.length === 0) {
        return [];
    }

    // Use the first available tileset for this type
    const primaryTileset = tilesets[0];
    return TilesetRegistry.getAllTexturesForTileset(primaryTileset.id);
};

// Initialize the tileset registry
TilesetRegistry.initialize();
