// src/utils/textureDiscovery.ts

import { TilesetDefinition, TilesetComponent, TileType, AutotilingVariant, WallTilingVariant, STANDARD_AUTOTILING_COMPONENTS, WALL_COMPONENTS, SIMPLE_COMPONENTS } from '../types/textures';

/**
 * Texture Discovery Utilities
 * 
 * This module provides utilities for dynamically discovering and validating
 * texture tilesets from filesystem or configuration without hardcoding
 */

// Interface for tileset manifest files
export interface TilesetManifest {
    id: string;
    name: string;
    theme: string;
    tileType: TileType;
    fallbackVariant: string;
    availableComponents: string[]; // List of available filenames
}

// Tileset discovery configuration
export interface DiscoveryConfig {
    baseAssetsPath: string;
    enableFilesystemScanning: boolean;
    manifestFiles: string[]; // Paths to tileset manifest JSON files
}

/**
 * Discovers tilesets from various sources
 */
export class TextureDiscovery {
    private config: DiscoveryConfig;

    constructor(config: DiscoveryConfig = {
        baseAssetsPath: '/assets/tilesets',
        enableFilesystemScanning: false, // Disabled by default as it requires server support
        manifestFiles: []
    }) {
        this.config = config;
    }

    /**
     * Discovers all available tilesets
     */
    async discoverTilesets(): Promise<TilesetDefinition[]> {
        const tilesets: TilesetDefinition[] = [];

        // Load from manifest files if provided
        for (const manifestPath of this.config.manifestFiles) {
            try {
                const manifest = await this.loadManifest(manifestPath);
                const tileset = this.createTilesetFromManifest(manifest);
                if (tileset) {
                    tilesets.push(tileset);
                }
            } catch (error) {
                console.warn(`Failed to load tileset manifest ${manifestPath}:`, error);
            }
        }

        // TODO: Add filesystem scanning support when needed
        // This would require server-side directory listing or build-time generation
        
        return tilesets;
    }

    /**
     * Loads a tileset manifest from a JSON file
     */
    private async loadManifest(manifestPath: string): Promise<TilesetManifest> {
        const response = await fetch(manifestPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch manifest: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Creates a tileset definition from a manifest
     */
    private createTilesetFromManifest(manifest: TilesetManifest): TilesetDefinition | null {
        // Get the appropriate component template for this tile type
        const componentTemplate = this.getComponentTemplate(manifest.tileType);
        
        // Validate and create components based on available files
        const validComponents = this.createComponentsFromManifest(manifest, componentTemplate);
        
        if (validComponents.length === 0) {
            console.warn(`No valid components found for tileset ${manifest.id}`);
            return null;
        }

        return {
            id: manifest.id,
            name: manifest.name,
            theme: manifest.theme,
            tileType: manifest.tileType,
            baseDir: `${this.config.baseAssetsPath}/${manifest.theme}/${manifest.tileType}`,
            fallbackVariant: manifest.fallbackVariant,
            components: validComponents
        };
    }

    /**
     * Gets the appropriate component template for a tile type
     */
    private getComponentTemplate(tileType: TileType): TilesetComponent[] {
        switch (tileType) {
            case "grass":
            case "stone":
                return STANDARD_AUTOTILING_COMPONENTS;
            case "wall":
                return WALL_COMPONENTS;
            case "water":
                return SIMPLE_COMPONENTS;
            default:
                return SIMPLE_COMPONENTS;
        }
    }

    /**
     * Creates validated components from manifest data
     */
    private createComponentsFromManifest(
        manifest: TilesetManifest, 
        template: TilesetComponent[]
    ): TilesetComponent[] {
        const validComponents: TilesetComponent[] = [];

        for (const templateComponent of template) {
            // Check if this component's file is available
            if (manifest.availableComponents.includes(templateComponent.filename)) {
                validComponents.push(templateComponent);
            } else if (templateComponent.required) {
                console.warn(
                    `Required component ${templateComponent.variant} (${templateComponent.filename}) ` +
                    `not found in tileset ${manifest.id}`
                );
                // For required components, we might want to fail the entire tileset
                // or use a different fallback strategy
            }
        }

        return validComponents;
    }

    /**
     * Validates that a tileset has all required components
     */
    validateTileset(tileset: TilesetDefinition): { valid: boolean; missingRequired: string[]; warnings: string[] } {
        const template = this.getComponentTemplate(tileset.tileType);
        const missingRequired: string[] = [];
        const warnings: string[] = [];

        for (const templateComponent of template) {
            const hasComponent = tileset.components.some(c => c.variant === templateComponent.variant);
            
            if (!hasComponent) {
                if (templateComponent.required) {
                    missingRequired.push(templateComponent.variant as string);
                } else {
                    warnings.push(`Optional component ${templateComponent.variant} not available`);
                }
            }
        }

        // Check if fallback variant exists
        const hasFallback = tileset.components.some(c => c.variant === tileset.fallbackVariant);
        if (!hasFallback) {
            missingRequired.push(`Fallback variant ${tileset.fallbackVariant}`);
        }

        return {
            valid: missingRequired.length === 0,
            missingRequired,
            warnings
        };
    }

    /**
     * Creates a minimal tileset definition for backwards compatibility
     * This allows migration from hardcoded textures
     */
    static createLegacyTileset(
        id: string,
        name: string,
        tileType: TileType,
        baseDir: string,
        availableVariants: (AutotilingVariant | WallTilingVariant)[]
    ): TilesetDefinition {
        const discovery = new TextureDiscovery();
        const template = discovery.getComponentTemplate(tileType);
        
        // Filter template to only include variants that are available
        const components = template.filter(t => 
            availableVariants.includes(t.variant as any)
        );

        // Use the first available variant as fallback, or 'single' if available
        const fallbackVariant = availableVariants.includes(AutotilingVariant.SINGLE as any) 
            ? AutotilingVariant.SINGLE 
            : availableVariants[0] as string;

        return {
            id,
            name,
            theme: 'legacy',
            tileType,
            baseDir,
            fallbackVariant,
            components
        };
    }
}

/**
 * Helper function to create tileset manifests for existing texture structures
 * This helps transition from the current hardcoded approach
 */
export function generateManifestForExistingTextures(
    id: string,
    name: string,
    theme: string,
    tileType: TileType,
    existingTextures: { variant: string; filename: string }[]
): TilesetManifest {
    return {
        id,
        name,
        theme,
        tileType,
        fallbackVariant: AutotilingVariant.SINGLE,
        availableComponents: existingTextures.map(t => t.filename)
    };
}

// Default discovery instance
export const defaultTextureDiscovery = new TextureDiscovery();