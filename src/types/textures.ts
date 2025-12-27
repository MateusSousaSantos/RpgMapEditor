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

// Grass autotiling texture definitions
export const GRASS_AUTOTILING_TEXTURES: AutotilingTexture[] = [
    // Single isolated tile
    {
        id: "grass_single", name: "Grass Single", image_url: "/assets/grass_single.png",
        tileType: "grass", variant: AutotilingVariant.SINGLE, connectivityMask: 0
    },

    // Straight edges (one cardinal connection)
    {
        id: "grass_edge_top", name: "Grass Edge Top", image_url: "/assets/grass_edge_top.png",
        tileType: "grass", variant: AutotilingVariant.EDGE_TOP, connectivityMask: DIRECTION_MASKS.S
    },
    {
        id: "grass_edge_right", name: "Grass Edge Right", image_url: "/assets/grass_edge_right.png",
        tileType: "grass", variant: AutotilingVariant.EDGE_RIGHT, connectivityMask: DIRECTION_MASKS.W
    },
    {
        id: "grass_edge_bottom", name: "Grass Edge Bottom", image_url: "/assets/grass_edge_bottom.png",
        tileType: "grass", variant: AutotilingVariant.EDGE_BOTTOM, connectivityMask: DIRECTION_MASKS.N
    },
    {
        id: "grass_edge_left", name: "Grass Edge Left", image_url: "/assets/grass_edge_left.png",
        tileType: "grass", variant: AutotilingVariant.EDGE_LEFT, connectivityMask: DIRECTION_MASKS.E
    },

    // External corners (two adjacent cardinal connections)
    {
        id: "grass_corner_tl", name: "Grass Corner Top-Left", image_url: "/assets/grass_corner_tl.png",
        tileType: "grass", variant: AutotilingVariant.CORNER_TL, connectivityMask: DIRECTION_MASKS.S | DIRECTION_MASKS.E
    },
    {
        id: "grass_corner_tr", name: "Grass Corner Top-Right", image_url: "/assets/grass_corner_tr.png",
        tileType: "grass", variant: AutotilingVariant.CORNER_TR, connectivityMask: DIRECTION_MASKS.S | DIRECTION_MASKS.W
    },
    {
        id: "grass_corner_bl", name: "Grass Corner Bottom-Left", image_url: "/assets/grass_corner_bl.png",
        tileType: "grass", variant: AutotilingVariant.CORNER_BL, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E
    },
    {
        id: "grass_corner_br", name: "Grass Corner Bottom-Right", image_url: "/assets/grass_corner_br.png",
        tileType: "grass", variant: AutotilingVariant.CORNER_BR, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.W
    },

    // Internal corners (three cardinal connections, missing one diagonal)
    {
        id: "grass_inner_tl", name: "Grass Inner Top-Left", image_url: "/assets/grass_inner_tl.png",
        tileType: "grass", variant: AutotilingVariant.INNER_TL, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W
    },
    {
        id: "grass_inner_tr", name: "Grass Inner Top-Right", image_url: "/assets/grass_inner_tr.png",
        tileType: "grass", variant: AutotilingVariant.INNER_TR, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W
    },
    {
        id: "grass_inner_bl", name: "Grass Inner Bottom-Left", image_url: "/assets/grass_inner_bl.png",
        tileType: "grass", variant: AutotilingVariant.INNER_BL, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W
    },
    {
        id: "grass_inner_br", name: "Grass Inner Bottom-Right", image_url: "/assets/grass_inner_br.png",
        tileType: "grass", variant: AutotilingVariant.INNER_BR, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W
    },

    // Straight connections (two opposite cardinal connections)
    {
        id: "grass_horizontal", name: "Grass Horizontal", image_url: "/assets/grass_horizontal.png",
        tileType: "grass", variant: AutotilingVariant.HORIZONTAL, connectivityMask: DIRECTION_MASKS.W | DIRECTION_MASKS.E
    },
    {
        id: "grass_vertical", name: "Grass Vertical", image_url: "/assets/grass_vertical.png",
        tileType: "grass", variant: AutotilingVariant.VERTICAL, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.S
    },

    // T-junctions (three cardinal connections)
    {
        id: "grass_t_top", name: "Grass T-Top", image_url: "/assets/grass_t_top.png",
        tileType: "grass", variant: AutotilingVariant.T_TOP, connectivityMask: DIRECTION_MASKS.S | DIRECTION_MASKS.W | DIRECTION_MASKS.E
    },
    {
        id: "grass_t_right", name: "Grass T-Right", image_url: "/assets/grass_t_right.png",
        tileType: "grass", variant: AutotilingVariant.T_RIGHT, connectivityMask: DIRECTION_MASKS.W | DIRECTION_MASKS.N | DIRECTION_MASKS.S
    },
    {
        id: "grass_t_bottom", name: "Grass T-Bottom", image_url: "/assets/grass_t_bottom.png",
        tileType: "grass", variant: AutotilingVariant.T_BOTTOM, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.W | DIRECTION_MASKS.E
    },
    {
        id: "grass_t_left", name: "Grass T-Left", image_url: "/assets/grass_t_left.png",
        tileType: "grass", variant: AutotilingVariant.T_LEFT, connectivityMask: DIRECTION_MASKS.E | DIRECTION_MASKS.N | DIRECTION_MASKS.S
    },

    // Center (all four cardinal connections)
    {
        id: "grass_center", name: "Grass Center", image_url: "/assets/grass_center.png",
        tileType: "grass", variant: AutotilingVariant.CENTER, connectivityMask: DIRECTION_MASKS.N | DIRECTION_MASKS.E | DIRECTION_MASKS.S | DIRECTION_MASKS.W
    }
];

// Water autotiling texture definitions (simple single texture for testing)
export const WATER_AUTOTILING_TEXTURES: AutotilingTexture[] = [
    // Single water tile (used for all water placements)
    {
        id: "water_single", name: "Water", image_url: "/assets/water.png",
        tileType: "water", variant: AutotilingVariant.SINGLE, connectivityMask: 0
    }
];

// Wall autotiling texture definitions (all positional variants)
export const WALL_AUTOTILING_TEXTURES: AutotilingTexture[] = [
    {
        id: "wall_bottom_left", name: "Wall Bottom Left", image_url: "/assets/walls/wood/bottom_left.png",
        tileType: "wall", variant: WallTilingVariant.BOTTOM_LEFT, connectivityMask: 0
    },
    {
        id: "wall_bottom_right", name: "Wall Bottom Right", image_url: "/assets/walls/wood/bottom_right.png",
        tileType: "wall", variant: WallTilingVariant.BOTTOM_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_bottom_vertical_edge", name: "Wall Bottom Vertical Edge", image_url: "/assets/walls/wood/bottom_vertical_edge.png",
        tileType: "wall", variant: WallTilingVariant.BOTTOM_VERTICAL_EDGE, connectivityMask: 0
    },
    {
        id: "wall_cross", name: "Wall Cross", image_url: "/assets/walls/wood/cross.png",
        tileType: "wall", variant: WallTilingVariant.CROSS, connectivityMask: 0
    },
    {
        id: "wall_full_bottom_center", name: "Wall Full Bottom Center", image_url: "/assets/walls/wood/full_bottom_center.png",
        tileType: "wall", variant: WallTilingVariant.FULL_BOTTOM_CENTER, connectivityMask: 0
    },
    {
        id: "wall_full_bottom_left", name: "Wall Full Bottom Left", image_url: "/assets/walls/wood/full_bottom_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_BOTTOM_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_bottom_left_corner", name: "Wall Full Bottom Left Corner", image_url: "/assets/walls/wood/full_bottom_left_corner.png",
        tileType: "wall", variant: WallTilingVariant.FULL_BOTTOM_LEFT_CORNER, connectivityMask: 0
    },
    {
        id: "wall_full_bottom_right", name: "Wall Full Bottom Right", image_url: "/assets/walls/wood/full_bottom_right.png",
        tileType: "wall", variant: WallTilingVariant.FULL_BOTTOM_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_bottom_right_corner", name: "Wall Full Bottom Right Corner", image_url: "/assets/walls/wood/full_bottom_right_corner.png",
        tileType: "wall", variant: WallTilingVariant.FULL_BOTTOM_RIGHT_CORNER, connectivityMask: 0
    },
    {
        id: "wall_full_center", name: "Wall Full Center", image_url: "/assets/walls/wood/full_center.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CENTER, connectivityMask: 0
    },
    {
        id: "wall_full_center_left", name: "Wall Full Center Left", image_url: "/assets/walls/wood/full_center_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CENTER_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_center_right", name: "Wall Full Center Right", image_url: "/assets/walls/wood/full_center_right.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CENTER_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_top_center", name: "Wall Full Top Center", image_url: "/assets/walls/wood/full_top_center.png",
        tileType: "wall", variant: WallTilingVariant.FULL_TOP_CENTER, connectivityMask: 0
    },
    {
        id: "wall_full_top_left", name: "Wall Full Top Left", image_url: "/assets/walls/wood/full_top_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_TOP_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_top_left_corner", name: "Wall Full Top Left Corner", image_url: "/assets/walls/wood/full_top_left_corner.png",
        tileType: "wall", variant: WallTilingVariant.FULL_TOP_LEFT_CORNER, connectivityMask: 0
    },
    {
        id: "wall_full_top_right", name: "Wall Full Top Right", image_url: "/assets/walls/wood/full_top_right.png",
        tileType: "wall", variant: WallTilingVariant.FULL_TOP_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_top_right_corner", name: "Wall Full Top Right Corner", image_url: "/assets/walls/wood/full_top_right_corner.png",
        tileType: "wall", variant: WallTilingVariant.FULL_TOP_RIGHT_CORNER, connectivityMask: 0
    },
    {
        id: "wall_full_t_bottom_left", name: "Wall Full T Bottom Left", image_url: "/assets/walls/wood/full_t_bottom_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_BOTTOM_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_t_bottom_right", name: "Wall Full T Bottom Right", image_url: "/assets/walls/wood/full_t_bottom_right.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_BOTTOM_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_t_bottom_right_left", name: "Wall Full T Bottom Right Left", image_url: "/assets/walls/wood/full_t_bottom_right_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_BOTTOM_RIGHT_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_t_left_bottom", name: "Wall Full T Left Bottom", image_url: "/assets/walls/wood/full_t_left_bottom.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_LEFT_BOTTOM, connectivityMask: 0
    },
    {
        id: "wall_full_t_left_top", name: "Wall Full T Left Top", image_url: "/assets/walls/wood/full_t_left_top.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_LEFT_TOP, connectivityMask: 0
    },
    {
        id: "wall_full_t_left_top_bottom", name: "Wall Full T Left Top Bottom", image_url: "/assets/walls/wood/full_t_left_top_bottom.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_LEFT_TOP_BOTTOM, connectivityMask: 0
    },
    {
        id: "wall_full_t_right_bottom", name: "Wall Full T Right Bottom", image_url: "/assets/walls/wood/full_t_right_bottom.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_RIGHT_BOTTOM, connectivityMask: 0
    },
    {
        id: "wall_full_t_right_top", name: "Wall Full T Right Top", image_url: "/assets/walls/wood/full_t_right_top.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_RIGHT_TOP, connectivityMask: 0
    },
    {
        id: "wall_full_t_right_top_bottom", name: "Wall Full T Right Top Bottom", image_url: "/assets/walls/wood/full_t_right_top_bottom.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_RIGHT_TOP_BOTTOM, connectivityMask: 0
    },
    {
        id: "wall_full_t_top_left", name: "Wall Full T Top Left", image_url: "/assets/walls/wood/full_t_top_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_TOP_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_t_top_right", name: "Wall Full T Top Right", image_url: "/assets/walls/wood/full_t_top_right.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_TOP_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_t_top_right_left", name: "Wall Full T Top Right Left", image_url: "/assets/walls/wood/full_t_top_right_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_T_TOP_RIGHT_LEFT, connectivityMask: 0
    },
    {
        id: "wall_horizontal", name: "Wall Horizontal", image_url: "/assets/walls/wood/horizontal.png",
        tileType: "wall", variant: WallTilingVariant.HORIZONTAL, connectivityMask: 0
    },
    {
        id: "wall_left_horizontal_edge", name: "Wall Left Horizontal Edge", image_url: "/assets/walls/wood/left_horizontal_edge.png",
        tileType: "wall", variant: WallTilingVariant.LEFT_HORIZONTAL_EDGE, connectivityMask: 0
    },
    {
        id: "wall_right_horizontal_edge", name: "Wall Right Horizontal Edge", image_url: "/assets/walls/wood/right_horizontal_edge.png",
        tileType: "wall", variant: WallTilingVariant.RIGHT_HORIZONTAL_EDGE, connectivityMask: 0
    },
    {
        id: "wall_single", name: "Wall Single", image_url: "/assets/walls/wood/single.png",
        tileType: "wall", variant: WallTilingVariant.SINGLE, connectivityMask: 0
    },
    {
        id: "wall_t_bottom", name: "Wall T Bottom", image_url: "/assets/walls/wood/t_bottom.png",
        tileType: "wall", variant: WallTilingVariant.T_BOTTOM, connectivityMask: 0
    },
    {
        id: "wall_t_left", name: "Wall T Left", image_url: "/assets/walls/wood/t_left.png",
        tileType: "wall", variant: WallTilingVariant.T_LEFT, connectivityMask: 0
    },
    {
        id: "wall_t_right", name: "Wall T Right", image_url: "/assets/walls/wood/t_right.png",
        tileType: "wall", variant: WallTilingVariant.T_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_t_top", name: "Wall T Top", image_url: "/assets/walls/wood/t_top.png",
        tileType: "wall", variant: WallTilingVariant.T_TOP, connectivityMask: 0
    },
    {
        id: "wall_top_left", name: "Wall Top Left", image_url: "/assets/walls/wood/top_left.png",
        tileType: "wall", variant: WallTilingVariant.TOP_LEFT, connectivityMask: 0
    },
    {
        id: "wall_top_right", name: "Wall Top Right", image_url: "/assets/walls/wood/top_right.png",
        tileType: "wall", variant: WallTilingVariant.TOP_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_top_vertical_edge", name: "Wall Top Vertical Edge", image_url: "/assets/walls/wood/top_vertical_edge.png",
        tileType: "wall", variant: WallTilingVariant.TOP_VERTICAL_EDGE, connectivityMask: 0
    },
    {
        id: "wall_vertical", name: "Wall Vertical", image_url: "/assets/walls/wood/vertical.png",
        tileType: "wall", variant: WallTilingVariant.VERTICAL, connectivityMask: 0
    },
    {
        id: "wall_full_cross_top_left", name: "Wall Full Cross Top Left", image_url: "/assets/walls/wood/full_cross_top_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CROSS_TOP_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_cross_top_right", name: "Wall Full Cross Top Right", image_url: "/assets/walls/wood/full_cross_top_right.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CROSS_TOP_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_cross_bottom_left", name: "Wall Full Cross Bottom Left", image_url: "/assets/walls/wood/full_cross_bottom_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CROSS_BOTTOM_LEFT, connectivityMask: 0
    },
    {
        id: "wall_full_cross_bottom_right", name: "Wall Full Cross Bottom Right", image_url: "/assets/walls/wood/full_cross_bottom_right.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CROSS_BOTTOM_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_cross_top_left_bottom_right", name: "Wall Full Cross Top Left Bottom Right", image_url: "/assets/walls/wood/full_cross_top_left_bottom_right.png", 
        tileType: "wall", variant: WallTilingVariant.FULL_CROSS_TOP_LEFT_BOTTOM_RIGHT, connectivityMask: 0
    },
    {
        id: "wall_full_cross_top_right_bottom_left", name: "Wall Full Cross Top Right Bottom Left", image_url: "/assets/walls/wood/full_cross_top_right_bottom_left.png",
        tileType: "wall", variant: WallTilingVariant.FULL_CROSS_TOP_RIGHT_BOTTOM_LEFT, connectivityMask: 0
    }   
];

// Tile types for autotiling system
export type TileType = "grass" | "water" | "stone" | "wall" | "empty";

// Helper function to get all textures for a specific tile type
export const getTexturesForType = (tileType: TileType): AutotilingTexture[] => {
    switch (tileType) {
        case "grass":
            return GRASS_AUTOTILING_TEXTURES;
        case "water":
            return WATER_AUTOTILING_TEXTURES;
        case "wall":
            return WALL_AUTOTILING_TEXTURES;
        default:
            return [];
    }
};
