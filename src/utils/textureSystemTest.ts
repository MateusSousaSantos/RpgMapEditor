// src/utils/textureSystemTest.ts

import { TilesetRegistry, TileType, AutotilingVariant, WallTilingVariant } from '../types/textures';

/**
 * Simple test utility to verify the new dynamic texture system
 */
export function testTextureSystem() {
    console.log('🧪 Testing Dynamic Texture System...');

    // Test 1: Registry initialization
    console.log('\n1️⃣ Testing registry initialization...');
    const allTilesets = TilesetRegistry.getAllTilesets();
    console.log(`   ✅ Registered ${allTilesets.length} tilesets:`, allTilesets.map(t => t.id));

    // Test 2: Texture retrieval by type
    console.log('\n2️⃣ Testing texture retrieval by type...');
    const tileTypes: TileType[] = ['grass', 'water', 'wall'];
    
    for (const tileType of tileTypes) {
        const tilesets = TilesetRegistry.getTilesetsForType(tileType);
        console.log(`   📦 ${tileType}: ${tilesets.length} tileset(s) available`);
        
        if (tilesets.length > 0) {
            const primaryTileset = tilesets[0];
            const textures = TilesetRegistry.getAllTexturesForTileset(primaryTileset.id);
            console.log(`      └── ${primaryTileset.name}: ${textures.length} components`);
        }
    }

    // Test 3: Texture variants and fallbacks
    console.log('\n3️⃣ Testing texture variants and fallbacks...');
    const grassTilesets = TilesetRegistry.getTilesetsForType('grass');
    
    if (grassTilesets.length > 0) {
        const grassTilesetId = grassTilesets[0].id;
        
        // Test existing variant
        const singleTexture = TilesetRegistry.getTexture(grassTilesetId, AutotilingVariant.SINGLE);
        console.log(`   ✅ Single variant: ${singleTexture ? '✓ Found' : '✗ Missing'}`);
        
        // Test fallback for non-existent variant
        const fakeVariant = 'non_existent_variant' as any;
        const fallbackTexture = TilesetRegistry.getTexture(grassTilesetId, fakeVariant);
        console.log(`   🔄 Fallback test: ${fallbackTexture ? '✓ Fallback works' : '✗ No fallback'}`);
    }

    // Test 4: Wall texture system
    console.log('\n4️⃣ Testing wall texture system...');
    const wallTilesets = TilesetRegistry.getTilesetsForType('wall');
    
    if (wallTilesets.length > 0) {
        const wallTilesetId = wallTilesets[0].id;
        const wallTextures = TilesetRegistry.getAllTexturesForTileset(wallTilesetId);
        console.log(`   🧱 Wall tileset: ${wallTextures.length} variants available`);
        
        // Test a few key variants
        const testVariants = [
            WallTilingVariant.SINGLE,
            WallTilingVariant.HORIZONTAL, 
            WallTilingVariant.T_TOP,
            WallTilingVariant.CROSS
        ];
        
        for (const variant of testVariants) {
            const texture = TilesetRegistry.getTexture(wallTilesetId, variant);
            console.log(`      ${variant}: ${texture ? '✓' : '✗'}`);
        }
    }

    console.log('\n🎉 Texture system test completed!\n');
}