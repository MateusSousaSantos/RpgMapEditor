// src/types/props.ts

export interface Prop {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    src: string;
    color?: string; // Hex color for tinting black and white textures
}

export interface PropDefinition {
    id: string;
    name: string;
    src: string;
    defaultWidth: number;
    defaultHeight: number;
    category: PropCategory;
    colorable?: boolean; // Whether this prop supports color tinting
}

export type PropCategory = 'nature' | 'furniture' | 'decoration' | 'structure';

export interface PropCategoryConfig {
    id: PropCategory;
    name: string;
    icon: string;
}

// Prop categories configuration
export const PROP_CATEGORIES: PropCategoryConfig[] = [
    { id: 'nature', name: 'Nature', icon: 'tree' },
    { id: 'furniture', name: 'Furniture', icon: 'chair' },
    { id: 'decoration', name: 'Decoration', icon: 'star' },
    { id: 'structure', name: 'Structure', icon: 'building' },
];

// Available props registry
// To add new props:
// 1. Add the prop image to public/assets/props/
// 2. Add a new PropDefinition to this array with the correct category
// 3. The prop will automatically appear in the sidebar under its category
// 4. Set colorable: true for black/white props that support recoloring
export const PROP_REGISTRY: PropDefinition[] = [
    {
        id: 'rock',
        name: 'Rock',
        src: '/assets/props/pedra.png',
        defaultWidth: 16,
        defaultHeight: 16,
        category: 'nature',
        colorable: true, // Rock can be recolored
    },
    {
        id: 'cerca',
        name: 'Wooden Fence',
        src: '/assets/props/cerca.png',
        defaultWidth: 16,
        defaultHeight: 16,
        category: 'structure',
        colorable: true, // Fence can be recolored
    },

    {
        id: 'cerca1',
        name: 'Wooden Fence',
        src: '/assets/props/cerca1.png',
        defaultWidth: 16,
        defaultHeight: 16,
        category: 'structure',
        colorable: true, // Fence can be recolored
    },
    {
        id: 'cerca2',
        name: 'Wooden Fence',
        src: '/assets/props/cerca2.png',
        defaultWidth: 16,
        defaultHeight: 16,
        category: 'structure',
        colorable: true, // Fence can be recolored
    },

];

// Helper function to get props by category
export const getPropsByCategory = (category: PropCategory): PropDefinition[] => {
    return PROP_REGISTRY.filter(prop => prop.category === category);
};

// Helper function to get all categories with props
export const getCategoriesWithProps = (): PropCategoryConfig[] => {
    return PROP_CATEGORIES.filter(category =>
        PROP_REGISTRY.some(prop => prop.category === category.id)
    );
};

// Helper function to check if a prop type supports coloring
export const isPropColorable = (propType: string): boolean => {
    const propDef = PROP_REGISTRY.find(prop => prop.id === propType);
    return propDef?.colorable === true;
};

// Helper function to get prop definition by type
export const getPropDefinition = (propType: string): PropDefinition | undefined => {
    return PROP_REGISTRY.find(prop => prop.id === propType);
};
