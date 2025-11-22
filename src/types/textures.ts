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
    variant: AutotilingVariant;
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

// Tile types for autotiling system
export type TileType = "grass" | "water" | "stone" | "empty";

// Helper function to get all textures for a specific tile type
export const getTexturesForType = (tileType: TileType): AutotilingTexture[] => {
    switch (tileType) {
        case "grass":
            return GRASS_AUTOTILING_TEXTURES;
        case "water":
            return WATER_AUTOTILING_TEXTURES;
        default:
            return [];
    }
};
