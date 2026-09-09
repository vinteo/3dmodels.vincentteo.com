import { describe, it, expect, beforeAll } from 'vitest';
import {
  buildFlagsKeychainParts,
  buildFlagsKeychain,
  defaultFlagsParameters,
  flagsParameters,
  calculateFlagsDimensions,
  flagsKeychainModel,
  registerFlag,
  createBicolorFlagGenerator,
  drawStar,
  drawCrescent,
  drawMapleLeaf
} from '../engines/replicad/models/flagsKeychain';
import { ensureReplicadReady } from '../engines/replicad/occt';

describe('Flags of the World Hex Keychain Model', () => {
  beforeAll(async () => {
    await ensureReplicadReady();
  });

  it('verifies model metadata, project grouping, and default parameters', () => {
    expect(flagsKeychainModel.id).toBe('flags-keychain');
    expect(flagsKeychainModel.project).toBe('Hex Keychain');
    expect(flagsKeychainModel.partName).toBe('Flags of the World');
    expect(flagsKeychainModel.parameters).toBe(flagsParameters);
    expect(defaultFlagsParameters.hex_radius).toBe(25);
    expect(defaultFlagsParameters.flag_type).toBe('empty');
    expect(defaultFlagsParameters.flag_orientation).toBe('standard');
    expect(defaultFlagsParameters.flag_depth).toBe(1.5);
    expect(defaultFlagsParameters.include_backplate).toBe(true);
    expect(defaultFlagsParameters.include_keychain_ring).toBe(true);
    expect(defaultFlagsParameters.include_flag_mirror).toBe(false);
  });

  it('supports custom flag_depth parameter for embossing or insetting flag parts', () => {
    const partsCustomDepth = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'united_states',
      flag_depth: 1.5
    });
    expect(partsCustomDepth.length).toBeGreaterThan(10);
    const canton = partsCustomDepth.find((p) => p.name === 'Flag_Canton_Blue');
    expect(canton).toBeDefined();
  });

  it('builds empty frame with Hex_Frame, Hex_Backplate, and Keychain_Ring_Attachment by default', () => {
    const parts = buildFlagsKeychainParts(defaultFlagsParameters);
    expect(parts.length).toBe(3);

    const partNames = parts.map((p) => p.name);
    expect(partNames).toContain('Hex_Frame');
    expect(partNames).toContain('Hex_Backplate');
    expect(partNames).toContain('Keychain_Ring_Attachment');
    expect(partNames).not.toContain('Flag_Top');
  });

  it('generates Indonesia flag with red top and white bottom by default', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'indonesia'
    });
    expect(parts.length).toBe(5);

    const topPart = parts.find((p) => p.name === 'Flag_Top');
    const bottomPart = parts.find((p) => p.name === 'Flag_Bottom');
    expect(topPart?.color).toBe('#ef4444'); // Indonesia Red
    expect(bottomPart?.color).toBe('#f8fafc'); // Indonesia White
  });

  it('generates Poland flag with white top and red bottom', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'poland'
    });
    const topPart = parts.find((p) => p.name === 'Flag_Top');
    const bottomPart = parts.find((p) => p.name === 'Flag_Bottom');
    expect(topPart?.color).toBe('#f8fafc'); // Poland White
    expect(bottomPart?.color).toBe('#ef4444'); // Poland Red
  });

  it('generates France tricolor flag in vertical orientation by default (opposite of Germany)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'france',
      flag_fillet: 0.1
    });
    expect(parts.length).toBe(6); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, Flag_Left, Flag_Middle, Flag_Right

    const leftPart = parts.find((p) => p.name === 'Flag_Left');
    const midPart = parts.find((p) => p.name === 'Flag_Middle');
    const rightPart = parts.find((p) => p.name === 'Flag_Right');

    expect(leftPart?.color).toBe('#2563eb'); // Blue
    expect(midPart?.color).toBe('#f8fafc'); // White
    expect(rightPart?.color).toBe('#ef4444'); // Red
    expect(leftPart?.shape).toBeDefined();
    expect(midPart?.shape).toBeDefined();
    expect(rightPart?.shape).toBeDefined();
  });

  it('generates Germany tricolor flag in horizontal orientation by default', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'germany'
    });
    expect(parts.length).toBe(6);

    const topPart = parts.find((p) => p.name === 'Flag_Top');
    const midPart = parts.find((p) => p.name === 'Flag_Middle');
    const botPart = parts.find((p) => p.name === 'Flag_Bottom');

    expect(topPart?.color).toBe('#0f172a'); // Black
    expect(midPart?.color).toBe('#ef4444'); // Red
    expect(botPart?.color).toBe('#eab308'); // Yellow
  });

  it('generates Russia tricolor flag with white top, blue middle, and red bottom by default', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'russia'
    });
    expect(parts.length).toBe(6);

    const topPart = parts.find((p) => p.name === 'Flag_Top');
    const midPart = parts.find((p) => p.name === 'Flag_Middle');
    const botPart = parts.find((p) => p.name === 'Flag_Bottom');

    expect(topPart?.color).toBe('#f8fafc'); // White
    expect(midPart?.color).toBe('#2563eb'); // Blue
    expect(botPart?.color).toBe('#ef4444'); // Red
    expect(topPart?.shape).toBeDefined();
    expect(midPart?.shape).toBeDefined();
    expect(botPart?.shape).toBeDefined();
  });

  it('generates Austria horizontal tricolor flag (Red / White / Red)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'austria'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#ef4444');
  });

  it('generates Nigeria vertical tricolor flag (Green / White / Green)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'nigeria'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Right')?.color).toBe('#16a34a');
  });

  it('generates Belarus horizontal bicolor flag (Red / Green)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'belarus'
    });
    expect(parts.length).toBe(5);
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
  });

  it('generates San Marino horizontal bicolor flag (White / Light Blue)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'san_marino'
    });
    expect(parts.length).toBe(5);
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#38bdf8');
  });

  it('generates Sierra Leone horizontal tricolor flag (Green / White / Blue)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'sierra_leone'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#0284c7');
  });

  it('generates Colombia uneven tricolor flag (2:1:1 Yellow / Blue / Red)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'colombia'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#ef4444');
  });

  it('generates Latvia uneven tricolor flag (2:1:2 Carmine / White / Carmine)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'latvia'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#991b1b');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#991b1b');
  });

  it('generates Thailand 5-stripe flag (1:1:2:1:1 Red / White / Blue / White / Red)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'thailand'
    });
    expect(parts.length).toBe(8); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, 5 flag stripes
    expect(parts.find((p) => p.name === 'Flag_Stripe_1')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Stripe_2')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_3')?.color).toBe('#1e3a8a');
    expect(parts.find((p) => p.name === 'Flag_Stripe_4')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_5')?.color).toBe('#ef4444');
  });

  it('generates Costa Rica 5-stripe flag (1:1:2:1:1 Blue / White / Red / White / Blue)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'costa_rica'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Stripe_1')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Stripe_2')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_3')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Stripe_4')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_5')?.color).toBe('#2563eb');
  });

  it('generates Botswana 5-stripe flag (Sky Blue / White / Black / White / Sky Blue)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'botswana'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Stripe_1')?.color).toBe('#38bdf8');
    expect(parts.find((p) => p.name === 'Flag_Stripe_2')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_3')?.color).toBe('#0f172a');
    expect(parts.find((p) => p.name === 'Flag_Stripe_4')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_5')?.color).toBe('#38bdf8');
  });

  it('generates Gambia 5-stripe flag (Red / White / Blue / White / Green)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'gambia'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Stripe_1')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Stripe_2')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_3')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Stripe_4')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Stripe_5')?.color).toBe('#16a34a');
  });

  it('generates Mauritius 4-stripe flag (Red / Blue / Yellow / Green)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'mauritius'
    });
    expect(parts.length).toBe(7); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, 4 flag stripes
    expect(parts.find((p) => p.name === 'Flag_Stripe_1')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Stripe_2')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Stripe_3')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Stripe_4')?.color).toBe('#16a34a');
  });

  it('generates Benin flag with green hoist and yellow top / red bottom fly bands', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'benin'
    });
    expect(parts.length).toBe(6); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, Flag_Left, Flag_Top_Right, Flag_Bottom_Right
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Top_Right')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Bottom_Right')?.color).toBe('#ef4444');
  });

  it('generates Madagascar flag with white hoist and red top / green bottom fly bands', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'madagascar'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Top_Right')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Bottom_Right')?.color).toBe('#16a34a');
  });

  it('generates Czechia flag with blue triangular pile and white top / red bottom bands', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'czechia'
    });
    expect(parts.length).toBe(6); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, Flag_Left (triangle), Flag_Top, Flag_Bottom
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#ef4444');
  });

  it('generates Martinique flag with red triangular pile and green top / black bottom bands', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'martinique'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#0f172a');
  });

  it('generates Bahamas flag with black triangular pile and aquamarine / gold / aquamarine stripes', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'bahamas'
    });
    expect(parts.length).toBe(7); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, Flag_Left (triangle), Flag_Top, Flag_Middle, Flag_Bottom
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#0f172a');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#0284c7');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#0284c7');
  });

  it('generates Palestine flag with red triangular pile and black / white / green stripes', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'palestine'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#0f172a');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
  });

  it('generates UAE flag with red vertical hoist and green / white / black horizontal stripes', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'uae'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#0f172a');
  });

  it('generates Japan flag with white field and red circular disc in center', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'japan'
    });
    expect(parts.length).toBe(5); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, Flag_Field, Flag_Circle
    expect(parts.find((p) => p.name === 'Flag_Field')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Circle')?.color).toBe('#dc2626');
  });

  it('generates Bangladesh flag with green field and red circular disc shifted towards hoist', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'bangladesh'
    });
    expect(parts.length).toBe(5);
    expect(parts.find((p) => p.name === 'Flag_Field')?.color).toBe('#15803d');
    expect(parts.find((p) => p.name === 'Flag_Circle')?.color).toBe('#ef4444');
  });

  it('generates Palau flag with sky blue field and golden yellow circular disc shifted towards hoist', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'palau'
    });
    expect(parts.length).toBe(5);
    expect(parts.find((p) => p.name === 'Flag_Field')?.color).toBe('#38bdf8');
    expect(parts.find((p) => p.name === 'Flag_Circle')?.color).toBe('#eab308');
  });

  it('generates England flag with red centered cross and white cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'england'
    });
    expect(parts.length).toBe(8); // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment, Flag_Cross, 4 Cantons
    expect(parts.find((p) => p.name === 'Flag_Cross')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Right')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Canton_Bottom_Left')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Canton_Bottom_Right')?.color).toBe('#f8fafc');
  });

  it('generates Denmark flag with white Nordic cross and red cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'denmark'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Cross')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#ef4444');
  });

  it('generates Finland flag with blue Nordic cross and white cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'finland'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Cross')?.color).toBe('#1d4ed8');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#f8fafc');
  });

  it('generates Sweden flag with yellow Nordic cross and blue cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'sweden'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Cross')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#2563eb');
  });

  it('generates Dominican Republic flag with white cross and alternating blue/red cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'dominican_republic'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Cross')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Right')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Canton_Bottom_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Canton_Bottom_Right')?.color).toBe('#2563eb');
  });

  it('generates Iceland flag with red inner cross, white outer cross, and blue cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'iceland'
    });
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Inner_Cross')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Outer_Cross')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#1d4ed8');
  });

  it('generates Norway flag with dark blue inner cross, white outer cross, and red cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'norway'
    });
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Inner_Cross')?.color).toBe('#1e3a8a');
    expect(parts.find((p) => p.name === 'Flag_Outer_Cross')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#ef4444');
  });

  it('generates Faroe Islands flag with red inner cross, azure blue outer cross, and white cantons', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'faroe_islands'
    });
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Inner_Cross')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Outer_Cross')?.color).toBe('#0284c7');
    expect(parts.find((p) => p.name === 'Flag_Canton_Top_Left')?.color).toBe('#f8fafc');
  });

  it('generates Scotland flag with white saltire cross and blue triangles', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'scotland'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Saltire')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#2563eb');
    expect(parts.find((p) => p.name === 'Flag_Right')?.color).toBe('#2563eb');
  });

  it('generates Jamaica flag with gold saltire, green top/bottom, and black left/right triangles', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'jamaica'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Saltire')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#0f172a');
    expect(parts.find((p) => p.name === 'Flag_Right')?.color).toBe('#0f172a');
  });

  it('generates Somalia flag with azure field and centered white 5-pointed star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'somalia'
    });
    expect(parts.length).toBe(5);
    expect(parts.find((p) => p.name === 'Flag_Field')?.color).toBe('#38bdf8');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates Vietnam flag with red field and centered gold 5-pointed star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'vietnam'
    });
    expect(parts.length).toBe(5);
    expect(parts.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');
  });

  it('generates Burkina Faso flag with red top, green bottom, and yellow star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'burkina_faso'
    });
    expect(parts.length).toBe(6);
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
  });

  it('generates Cameroon flag with green/red/yellow vertical stripes and yellow star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'cameroon'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Middle')?.color).toBe('#ef4444');
  });

  it('generates Cuba flag with red chevron, 5 blue/white stripes, and white star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'cuba'
    });
    expect(parts.length).toBe(10);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates Djibouti flag with white chevron, blue/green stripes, and red star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'djibouti'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#ef4444');
  });

  it('generates Ghana flag with red/yellow/green stripes and black star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'ghana'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#0f172a');
  });

  it('generates Guinea-Bissau flag with red hoist band, yellow/green fly, and black star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'guinea_bissau'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#0f172a');
  });

  it('generates Honduras flag with 5 turquoise stars in quincunx pattern', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'honduras'
    });
    expect(parts.length).toBe(11);
    expect(parts.find((p) => p.name === 'Flag_Star_Center')?.color).toBe('#0284c7');
    expect(parts.find((p) => p.name === 'Flag_Star_Top_Left')?.color).toBe('#0284c7');
  });

  it('generates Myanmar flag with yellow/green/red stripes and large white star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'myanmar'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates Puerto Rico flag with blue chevron, 5 red/white stripes, and white star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'puerto_rico'
    });
    expect(parts.length).toBe(10);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#1d4ed8');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates São Tomé and Príncipe flag with red chevron and 2 black stars', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'sao_tome_and_principe'
    });
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Star_1')?.color).toBe('#0f172a');
    expect(parts.find((p) => p.name === 'Flag_Star_2')?.color).toBe('#0f172a');
  });

  it('generates Senegal flag with green/yellow/red vertical stripes and green star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'senegal'
    });
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#16a34a');
  });

  it('generates South Sudan flag with blue chevron, 5 stripes, and yellow star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'south_sudan'
    });
    expect(parts.length).toBe(10);
    expect(parts.find((p) => p.name === 'Flag_Left')?.color).toBe('#1d4ed8');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');
  });

  it('generates Suriname flag with 5 stripes and yellow star on red stripe', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'suriname'
    });
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');
  });

  it('generates Syria flag with red/white/black stripes and 2 green stars', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'syria'
    });
    expect(parts.length).toBe(8);
    expect(parts.find((p) => p.name === 'Flag_Star_1')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Star_2')?.color).toBe('#16a34a');
  });

  it('generates Venezuela flag with yellow/blue/red stripes and arc of 8 white stars', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'venezuela'
    });
    expect(parts.length).toBe(14);
    expect(parts.find((p) => p.name === 'Flag_Star_1')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Star_8')?.color).toBe('#f8fafc');
  });

  it('generates Ukraine flag with blue top and yellow bottom and supports vertical orientation', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'ukraine',
      flag_orientation: 'vertical',
      flag_fillet: 0.2
    });
    expect(parts.length).toBe(5);

    const leftPart = parts.find((p) => p.name === 'Flag_Left');
    const rightPart = parts.find((p) => p.name === 'Flag_Right');
    expect(leftPart?.color).toBe('#eab308'); // Yellow (bottom rotated to left)
    expect(rightPart?.color).toBe('#2563eb'); // Blue (top rotated to right)
    expect(leftPart?.shape).toBeDefined();
    expect(rightPart?.shape).toBeDefined();
  });

  it('excludes backplate when include_backplate is false', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'indonesia',
      include_backplate: false
    });
    const partNames = parts.map((p) => p.name);
    expect(partNames).not.toContain('Hex_Backplate');
    expect(partNames).toContain('Hex_Frame');
    expect(partNames).toContain('Flag_Top');
    expect(partNames).toContain('Flag_Bottom');
    expect(partNames).toContain('Keychain_Ring_Attachment');
  });

  it('excludes keychain ring when include_keychain_ring is false', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      include_keychain_ring: false
    });
    const partNames = parts.map((p) => p.name);
    expect(partNames).not.toContain('Keychain_Ring_Attachment');
    expect(partNames).toContain('Hex_Frame');
  });

  it('fuses base solids into Hex_Keychain_Base while keeping flag parts separate when single_part is true', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'poland',
      single_part: true
    });
    expect(parts.length).toBe(3);
    const partNames = parts.map((p) => p.name);
    expect(partNames).toContain('Hex_Keychain_Base');
    expect(partNames).toContain('Flag_Top');
    expect(partNames).toContain('Flag_Bottom');
  });

  it('builds composite 3D shape successfully', () => {
    const shape = buildFlagsKeychain(defaultFlagsParameters);
    expect(shape).toBeDefined();
  });

  it('calculates exact model dimensions including vertex-to-vertex, side-to-side, height, and ring length', () => {
    const dims = calculateFlagsDimensions({
      hex_radius: 20,
      height: 3,
      include_keychain_ring: true,
      ring_thickness: 2
    });

    const v2v = dims.find((d) => d.id === 'vertex_to_vertex');
    expect(v2v?.value).toBe(40);
    expect(v2v?.formatted).toBe('40.0 mm');

    const s2s = dims.find((d) => d.id === 'side_to_side');
    expect(s2s?.value).toBeCloseTo(34.64, 2);

    const h = dims.find((d) => d.id === 'height');
    expect(h?.value).toBe(3);

    const fullLen = dims.find((d) => d.id === 'full_length');
    // totalLength = 2 * 20 + 2 * (3 + 2) - 1.5 = 40 + 10 - 1.5 = 48.5
    expect(fullLen?.value).toBe(48.5);
  });

  it('generates China flag with red field, 1 large star, and 4 small stars', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'china'
    });
    // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment + Flag_Field + 5 stars = 9 parts
    expect(parts.length).toBe(9);

    const fieldPart = parts.find((p) => p.name === 'Flag_Field');
    const largeStar = parts.find((p) => p.name === 'Flag_Star_Large');
    const smallStars = parts.filter((p) => p.name.startsWith('Flag_Star_Small_'));

    expect(fieldPart?.color).toBe('#ef4444');
    expect(largeStar?.color).toBe('#eab308');
    expect(smallStars.length).toBe(4);
    smallStars.forEach((s) => expect(s.color).toBe('#eab308'));
  });

  it('generates European Union flag with blue field and 12 circular gold stars', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'european_union'
    });
    // Hex_Frame, Hex_Backplate, Keychain_Ring_Attachment + Flag_Field + 12 stars = 16 parts
    expect(parts.length).toBe(16);

    const fieldPart = parts.find((p) => p.name === 'Flag_Field');
    const stars = parts.filter((p) => p.name.startsWith('Flag_Star_'));

    expect(fieldPart?.color).toBe('#1d4ed8');
    expect(stars.length).toBe(12);
    stars.forEach((s) => expect(s.color).toBe('#eab308'));
  });

  it('generates Central African Republic flag with 4 horizontal stripes, vertical red band, and gold star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'central_african_republic'
    });
    // Frame, Backplate, Ring + 4 stripes + 1 vertical stripe + 1 star = 9 parts
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Vertical_Stripe')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');
  });

  it('generates Chile flag with blue star canton, white top stripe, and red bottom stripe', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'chile'
    });
    // Frame, Backplate, Ring + Canton + 2 stripes + Star = 7 parts
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Canton')?.color).toBe('#1d4ed8');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates Democratic Republic of the Congo flag with sky blue field, diagonal red/yellow bend, and gold star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'dr_congo'
    });
    // Frame, Backplate, Ring + 2 field halves + 3 bend layers + 1 star = 9 parts
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Top_Left')?.color).toBe('#0284c7');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');
  });

  it('generates Liberia flag with blue star canton and 11 red/white stripes', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'liberia'
    });
    // Frame, Backplate, Ring + Canton + 11 stripes + Star = 16 parts
    expect(parts.length).toBe(16);
    expect(parts.find((p) => p.name === 'Flag_Canton')?.color).toBe('#1d4ed8');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates North Korea flag with blue/white/red stripes, white circle disc, and red star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'north_korea'
    });
    // Frame, Backplate, Ring + 5 stripes + Disc + Star = 10 parts
    expect(parts.length).toBe(10);
    expect(parts.find((p) => p.name === 'Flag_Circle')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#ef4444');
  });

  it('generates Panama flag with 4 quarters (2 white with stars, 1 red, 1 blue)', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'panama'
    });
    // Frame, Backplate, Ring + 4 quarters + 2 stars = 9 parts
    expect(parts.length).toBe(9);
    expect(parts.find((p) => p.name === 'Flag_Star_Blue')?.color).toBe('#1d4ed8');
    expect(parts.find((p) => p.name === 'Flag_Star_Red')?.color).toBe('#ef4444');
  });

  it('generates Saint Kitts and Nevis flag with green/red triangles, black/yellow bend, and 2 white stars', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'saint_kitts'
    });
    // Frame, Backplate, Ring + 2 triangles + 3 bend layers + 2 stars = 10 parts
    expect(parts.length).toBe(10);
    expect(parts.find((p) => p.name === 'Flag_Top_Left')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Bottom_Right')?.color).toBe('#16a34a');
    expect(parts.find((p) => p.name === 'Flag_Star_1')?.color).toBe('#f8fafc');
    expect(parts.find((p) => p.name === 'Flag_Star_2')?.color).toBe('#f8fafc');
  });

  it('generates Timor-Leste flag with red field, yellow chevron, black chevron, and white star', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'timor_leste'
    });
    // Frame, Backplate, Ring + Red field + Yellow chevron + Black chevron + Star = 7 parts
    expect(parts.length).toBe(7);
    expect(parts.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Yellow_Chevron')?.color).toBe('#eab308');
    expect(parts.find((p) => p.name === 'Flag_Black_Chevron')?.color).toBe('#0f172a');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates Togo flag with red star canton and 5 green/yellow stripes', () => {
    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'togo'
    });
    // Frame, Backplate, Ring + Canton + 5 stripes + Star = 10 parts
    expect(parts.length).toBe(10);
    expect(parts.find((p) => p.name === 'Flag_Canton')?.color).toBe('#ef4444');
    expect(parts.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('generates China flag in horizontal and vertical orientations', () => {
    const partsHoriz = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'china',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Red background + Large star + 4 Small stars = 9 parts
    expect(partsHoriz.length).toBe(9);
    expect(partsHoriz.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsHoriz.find((p) => p.name === 'Flag_Star_Large')?.color).toBe('#eab308');
    expect(partsHoriz.find((p) => p.name === 'Flag_Star_Small_1')?.color).toBe('#eab308');

    const partsVert = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'china',
      flag_orientation: 'vertical'
    });
    expect(partsVert.length).toBe(9);
    expect(partsVert.find((p) => p.name === 'Flag_Star_Large')?.shape).toBeDefined();
    expect(partsVert.find((p) => p.name === 'Flag_Star_Small_4')?.shape).toBeDefined();
  });

  it('generates Panama flag in horizontal and rotated orientations', () => {
    const partsHoriz = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'panama',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + 4 quarters + 2 stars = 9 parts
    expect(partsHoriz.length).toBe(9);
    expect(partsHoriz.find((p) => p.name === 'Flag_Top_Left_White')).toBeDefined();
    expect(partsHoriz.find((p) => p.name === 'Flag_Star_Blue')?.color).toBe('#1d4ed8');
    expect(partsHoriz.find((p) => p.name === 'Flag_Star_Red')?.color).toBe('#ef4444');

    const partsVert = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'panama',
      flag_orientation: 'vertical'
    });
    expect(partsVert.length).toBe(9);
    expect(partsVert.find((p) => p.name === 'Flag_Top_Right_White')).toBeDefined();
    expect(partsVert.find((p) => p.name === 'Flag_Bottom_Left_White')).toBeDefined();
    expect(partsVert.find((p) => p.name === 'Flag_Top_Left_Blue')).toBeDefined();
    expect(partsVert.find((p) => p.name === 'Flag_Bottom_Right_Red')).toBeDefined();
  });

  it('generates Chile and Liberia canton flags in horizontal and rotated orientations', () => {
    const partsChile = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'chile',
      flag_orientation: 'vertical'
    });
    // Frame, Backplate, Ring + Canton + 2 stripes + Star = 7 parts
    expect(partsChile.length).toBe(7);
    expect(partsChile.find((p) => p.name === 'Flag_Canton')?.color).toBe('#1d4ed8');
    expect(partsChile.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    const partsLiberia = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'liberia',
      flag_orientation: 'vertical'
    });
    // Frame, Backplate, Ring + Canton + 11 stripes + Star = 16 parts
    expect(partsLiberia.length).toBe(16);
    expect(partsLiberia.find((p) => p.name === 'Flag_Canton')?.color).toBe('#1d4ed8');
  });

  it('supports parametric multi-point stars in drawStar', () => {
    const star5 = drawStar(10, undefined, [0, 0], 0, 5);
    expect(star5).toBeDefined();

    const star7 = drawStar(10, undefined, [0, 0], 0, 7);
    expect(star7).toBeDefined();

    const star12 = drawStar(10, undefined, [0, 0], 0, 12);
    expect(star12).toBeDefined();
  });

  it('generates multi-pointed star flags correctly: Jordan (7-point) and Nauru (12-point)', () => {
    // Jordan
    const partsJordan = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'jordan',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Triangle (Red) + 3 Fly Bands (Black, White, Green) + 7-point Star (White) = 8 parts
    expect(partsJordan.length).toBe(8);
    expect(partsJordan.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(partsJordan.find((p) => p.name === 'Flag_Top')?.color).toBe('#0f172a');
    expect(partsJordan.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(partsJordan.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
    expect(partsJordan.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    const partsJordanRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'jordan',
      flag_orientation: 'vertical'
    });
    expect(partsJordanRotated.length).toBe(8);
    expect(partsJordanRotated.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(partsJordanRotated.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    // Nauru
    const partsNauru = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'nauru',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + 3 Stripes (Blue, Yellow, Blue) + 12-point Star (White) = 7 parts
    expect(partsNauru.length).toBe(7);
    expect(partsNauru.find((p) => p.name === 'Flag_Top')?.color).toBe('#0284c7');
    expect(partsNauru.find((p) => p.name === 'Flag_Middle')?.color).toBe('#eab308');
    expect(partsNauru.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#0284c7');
    expect(partsNauru.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    const partsNauruRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'nauru',
      flag_orientation: 'vertical'
    });
    expect(partsNauruRotated.length).toBe(7);
    expect(partsNauruRotated.find((p) => p.name === 'Flag_Right')?.color).toBe('#0284c7');
    expect(partsNauruRotated.find((p) => p.name === 'Flag_Middle')?.color).toBe('#eab308');
    expect(partsNauruRotated.find((p) => p.name === 'Flag_Left')?.color).toBe('#0284c7');
    expect(partsNauruRotated.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
  });

  it('supports parametric crescent generation with drawCrescent', () => {
    const crescent1 = drawCrescent(10, 8, [0, 0], 2, 0);
    expect(crescent1).toBeDefined();

    const crescent2 = drawCrescent(10, 8, [0, 0], 2, Math.PI / 4);
    expect(crescent2).toBeDefined();
  });

  it('generates crescent and star flags correctly: Algeria, Pakistan, Tunisia, and Turkey / Türkiye', () => {
    // Algeria
    const partsAlgeria = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'algeria',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Green Left + White Right + Red Crescent + Red Star = 7 parts
    expect(partsAlgeria.length).toBe(7);
    expect(partsAlgeria.find((p) => p.name === 'Flag_Left')?.color).toBe('#16a34a');
    expect(partsAlgeria.find((p) => p.name === 'Flag_Right')?.color).toBe('#f8fafc');
    expect(partsAlgeria.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#ef4444');
    expect(partsAlgeria.find((p) => p.name === 'Flag_Star')?.color).toBe('#ef4444');

    const partsAlgeriaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'algeria',
      flag_orientation: 'vertical'
    });
    expect(partsAlgeriaRotated.length).toBe(7);
    expect(partsAlgeriaRotated.find((p) => p.name === 'Flag_Top')?.color).toBe('#16a34a');
    expect(partsAlgeriaRotated.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#f8fafc');

    // Pakistan
    const partsPakistan = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'pakistan',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + White Hoist + Green Fly + White Crescent + White Star = 7 parts
    expect(partsPakistan.length).toBe(7);
    expect(partsPakistan.find((p) => p.name === 'Flag_Left')?.color).toBe('#f8fafc');
    expect(partsPakistan.find((p) => p.name === 'Flag_Right')?.color).toBe('#14532d');
    expect(partsPakistan.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#f8fafc');
    expect(partsPakistan.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    const partsPakistanRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'pakistan',
      flag_orientation: 'vertical'
    });
    expect(partsPakistanRotated.length).toBe(7);
    expect(partsPakistanRotated.find((p) => p.name === 'Flag_Top')?.color).toBe('#f8fafc');
    expect(partsPakistanRotated.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#14532d');

    // Tunisia
    const partsTunisia = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'tunisia',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Red Field + White Disc + Red Crescent + Red Star = 7 parts
    expect(partsTunisia.length).toBe(7);
    expect(partsTunisia.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsTunisia.find((p) => p.name === 'Flag_Circle')?.color).toBe('#f8fafc');
    expect(partsTunisia.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#ef4444');
    expect(partsTunisia.find((p) => p.name === 'Flag_Star')?.color).toBe('#ef4444');

    // Turkey / Türkiye
    const partsTurkey = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'turkey',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Red Field + White Crescent + White Star = 6 parts
    expect(partsTurkey.length).toBe(6);
    expect(partsTurkey.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsTurkey.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#f8fafc');
    expect(partsTurkey.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    const partsTurkiye = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'turkiye',
      flag_orientation: 'vertical'
    });
    expect(partsTurkiye.length).toBe(6);
    expect(partsTurkiye.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsTurkiye.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#f8fafc');
    expect(partsTurkiye.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');
    // Azerbaijan (8-pointed star)
    const partsAzerbaijan = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'azerbaijan',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Blue, Red, Green + Crescent + 8-point Star = 8 parts
    expect(partsAzerbaijan.length).toBe(8);
    expect(partsAzerbaijan.find((p) => p.name === 'Flag_Top')?.color).toBe('#0284c7');
    expect(partsAzerbaijan.find((p) => p.name === 'Flag_Middle')?.color).toBe('#ef4444');
    expect(partsAzerbaijan.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
    expect(partsAzerbaijan.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#f8fafc');
    expect(partsAzerbaijan.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    const partsAzerbaijanRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'azerbaijan',
      flag_orientation: 'vertical'
    });
    expect(partsAzerbaijanRotated.length).toBe(8);
    expect(partsAzerbaijanRotated.find((p) => p.name === 'Flag_Right')?.color).toBe('#0284c7');
    expect(partsAzerbaijanRotated.find((p) => p.name === 'Flag_Left')?.color).toBe('#16a34a');

    // Libya
    const partsLibya = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'libya',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Red, Black, Green + Crescent + Star = 8 parts
    expect(partsLibya.length).toBe(8);
    expect(partsLibya.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(partsLibya.find((p) => p.name === 'Flag_Middle')?.color).toBe('#0f172a');
    expect(partsLibya.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
    expect(partsLibya.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#f8fafc');
    expect(partsLibya.find((p) => p.name === 'Flag_Star')?.color).toBe('#f8fafc');

    const partsLibyaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'libya',
      flag_orientation: 'vertical'
    });
    expect(partsLibyaRotated.length).toBe(8);
    expect(partsLibyaRotated.find((p) => p.name === 'Flag_Right')?.color).toBe('#ef4444');
    expect(partsLibyaRotated.find((p) => p.name === 'Flag_Left')?.color).toBe('#16a34a');

    // Mauritania (upward crescent)
    const partsMauritania = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'mauritania',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Red, Green, Red + Gold Crescent + Gold Star = 8 parts
    expect(partsMauritania.length).toBe(8);
    expect(partsMauritania.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(partsMauritania.find((p) => p.name === 'Flag_Middle')?.color).toBe('#16a34a');
    expect(partsMauritania.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#ef4444');
    expect(partsMauritania.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#eab308');
    expect(partsMauritania.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');

    // Malaysia (canton, 14 stripes, crescent, 14-point star)
    const partsMalaysia = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'malaysia',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Canton + 14 Stripes + Crescent + 14-point Star = 20 parts
    expect(partsMalaysia.length).toBe(20);
    expect(partsMalaysia.find((p) => p.name === 'Flag_Canton')?.color).toBe('#1d4ed8');
    expect(partsMalaysia.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#eab308');
    expect(partsMalaysia.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');

    const partsMalaysiaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'malaysia',
      flag_orientation: 'vertical'
    });
    expect(partsMalaysiaRotated.length).toBe(20);
    expect(partsMalaysiaRotated.find((p) => p.name === 'Flag_Canton')?.color).toBe('#1d4ed8');
    expect(partsMalaysiaRotated.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#eab308');
    expect(partsMalaysiaRotated.find((p) => p.name === 'Flag_Star')?.color).toBe('#eab308');

    // Singapore (red/white bicolor, crescent + 5 stars)
    const partsSingapore = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'singapore',
      flag_orientation: 'standard'
    });
    // Frame, Backplate, Ring + Top (Red) + Bottom (White) + Crescent + 5 Stars = 11 parts
    expect(partsSingapore.length).toBe(11);
    expect(partsSingapore.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(partsSingapore.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#f8fafc');
    expect(partsSingapore.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#f8fafc');
    expect(partsSingapore.find((p) => p.name === 'Flag_Star_1')?.color).toBe('#f8fafc');
    expect(partsSingapore.find((p) => p.name === 'Flag_Star_5')?.color).toBe('#f8fafc');

    const partsSingaporeRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'singapore',
      flag_orientation: 'vertical'
    });
    expect(partsSingaporeRotated.length).toBe(11);
    expect(partsSingaporeRotated.find((p) => p.name === 'Flag_Right')?.color).toBe('#ef4444');
    expect(partsSingaporeRotated.find((p) => p.name === 'Flag_Left')?.color).toBe('#f8fafc');
    expect(partsSingaporeRotated.find((p) => p.name === 'Flag_Crescent')?.color).toBe('#f8fafc');
  });

  it('generates Laos, Bahrain, and Qatar flags correctly in horizontal and rotated modes', () => {
    // Laos (red/blue/red triband with white central circle disc)
    const partsLaos = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'laos',
      flag_orientation: 'standard'
    });
    expect(partsLaos.length).toBe(7);
    expect(partsLaos.find((p) => p.name === 'Flag_Top')?.color).toBe('#ef4444');
    expect(partsLaos.find((p) => p.name === 'Flag_Middle')?.color).toBe('#1d4ed8');
    expect(partsLaos.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#ef4444');
    expect(partsLaos.find((p) => p.name === 'Flag_Circle')?.color).toBe('#f8fafc');

    const partsLaosRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'laos',
      flag_orientation: 'vertical'
    });
    expect(partsLaosRotated.length).toBe(7);
    expect(partsLaosRotated.find((p) => p.name === 'Flag_Right')?.color).toBe('#ef4444');
    expect(partsLaosRotated.find((p) => p.name === 'Flag_Middle')?.color).toBe('#1d4ed8');
    expect(partsLaosRotated.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(partsLaosRotated.find((p) => p.name === 'Flag_Circle')?.color).toBe('#f8fafc');

    // Bahrain (white hoist with 5 serrated teeth, red fly)
    const partsBahrain = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'bahrain',
      flag_orientation: 'standard'
    });
    expect(partsBahrain.length).toBe(5);
    expect(partsBahrain.find((p) => p.name === 'Flag_Left')?.color).toBe('#f8fafc');
    expect(partsBahrain.find((p) => p.name === 'Flag_Right')?.color).toBe('#ef4444');

    const partsBahrainRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'bahrain',
      flag_orientation: 'vertical'
    });
    expect(partsBahrainRotated.length).toBe(5);
    expect(partsBahrainRotated.find((p) => p.name === 'Flag_Top')?.color).toBe('#f8fafc');
    expect(partsBahrainRotated.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#ef4444');

    // Qatar (white hoist with 9 serrated teeth, maroon fly)
    const partsQatar = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'qatar',
      flag_orientation: 'standard'
    });
    expect(partsQatar.length).toBe(5);
    expect(partsQatar.find((p) => p.name === 'Flag_Left')?.color).toBe('#f8fafc');
    expect(partsQatar.find((p) => p.name === 'Flag_Right')?.color).toBe('#88123b');

    const partsQatarRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'qatar',
      flag_orientation: 'vertical'
    });
    expect(partsQatarRotated.length).toBe(5);
    expect(partsQatarRotated.find((p) => p.name === 'Flag_Top')?.color).toBe('#f8fafc');
    expect(partsQatarRotated.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#88123b');

    // Greenland (white/red bicolor with offset counter-charged disc)
    const partsGreenland = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'greenland',
      flag_orientation: 'standard'
    });
    expect(partsGreenland.length).toBe(7);
    expect(partsGreenland.find((p) => p.name === 'Flag_Top')?.color).toBe('#f8fafc');
    expect(partsGreenland.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#ef4444');
    expect(partsGreenland.find((p) => p.name === 'Flag_Disc_Top')?.color).toBe('#ef4444');
    expect(partsGreenland.find((p) => p.name === 'Flag_Disc_Bottom')?.color).toBe('#f8fafc');

    const partsGreenlandRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'greenland',
      flag_orientation: 'vertical'
    });
    expect(partsGreenlandRotated.length).toBe(7);
    expect(partsGreenlandRotated.find((p) => p.name === 'Flag_Right')?.color).toBe('#f8fafc');
    expect(partsGreenlandRotated.find((p) => p.name === 'Flag_Left')?.color).toBe('#ef4444');
    expect(partsGreenlandRotated.find((p) => p.name === 'Flag_Disc_Right')?.color).toBe('#ef4444');
    expect(partsGreenlandRotated.find((p) => p.name === 'Flag_Disc_Left')?.color).toBe('#f8fafc');

    // Niger (orange/white/green horizontal stripes with orange central disc)
    const partsNiger = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'niger',
      flag_orientation: 'standard'
    });
    expect(partsNiger.length).toBe(7);
    expect(partsNiger.find((p) => p.name === 'Flag_Top')?.color).toBe('#f97316');
    expect(partsNiger.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(partsNiger.find((p) => p.name === 'Flag_Bottom')?.color).toBe('#16a34a');
    expect(partsNiger.find((p) => p.name === 'Flag_Circle')?.color).toBe('#f97316');

    const partsNigerRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'niger',
      flag_orientation: 'vertical'
    });
    expect(partsNigerRotated.length).toBe(7);
    expect(partsNigerRotated.find((p) => p.name === 'Flag_Right')?.color).toBe('#f97316');
    expect(partsNigerRotated.find((p) => p.name === 'Flag_Middle')?.color).toBe('#f8fafc');
    expect(partsNigerRotated.find((p) => p.name === 'Flag_Left')?.color).toBe('#16a34a');
    expect(partsNigerRotated.find((p) => p.name === 'Flag_Circle')?.color).toBe('#f97316');

    // South Korea (white field, Taegeuk red/blue, black trigrams)
    const partsSouthKorea = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'south_korea',
      flag_orientation: 'standard'
    });
    expect(partsSouthKorea.find((p) => p.name === 'Flag_Field')?.color).toBe('#f8fafc');
    expect(partsSouthKorea.find((p) => p.name === 'Flag_Taegeuk_Red')?.color).toBe('#ef4444');
    expect(partsSouthKorea.find((p) => p.name === 'Flag_Taegeuk_Blue')?.color).toBe('#1d4ed8');
    expect(partsSouthKorea.find((p) => p.name === 'Flag_Trigram_1')?.color).toBe('#0f172a');

    const partsSouthKoreaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'south_korea',
      flag_orientation: 'vertical'
    });
    expect(partsSouthKoreaRotated.find((p) => p.name === 'Flag_Field')?.color).toBe('#f8fafc');
    expect(partsSouthKoreaRotated.find((p) => p.name === 'Flag_Taegeuk_Red')?.color).toBe(
      '#ef4444'
    );
    expect(partsSouthKoreaRotated.find((p) => p.name === 'Flag_Taegeuk_Blue')?.color).toBe(
      '#1d4ed8'
    );
    expect(partsSouthKoreaRotated.find((p) => p.name === 'Flag_Trigram_1')?.color).toBe('#0f172a');
    // United Kingdom (Union Jack: blue field, white cross/saltires, red cross/saltires)
    const partsUK = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'united_kingdom',
      flag_orientation: 'standard'
    });
    expect(partsUK.find((p) => p.name === 'Flag_Field_Blue')?.color).toBe('#1e3a8a');
    expect(partsUK.find((p) => p.name === 'Flag_Cross_White')?.color).toBe('#f8fafc');
    expect(partsUK.find((p) => p.name === 'Flag_Cross_Red')?.color).toBe('#ef4444');

    const partsUKRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'united_kingdom',
      flag_orientation: 'vertical'
    });
    expect(partsUKRotated.find((p) => p.name === 'Flag_Field_Blue')?.color).toBe('#1e3a8a');
    expect(partsUKRotated.find((p) => p.name === 'Flag_Cross_White')?.color).toBe('#f8fafc');
    expect(partsUKRotated.find((p) => p.name === 'Flag_Cross_Red')?.color).toBe('#ef4444');

    // Australia (blue field, Union Jack canton, Commonwealth star, Southern Cross)
    const partsAustralia = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'australia',
      flag_orientation: 'standard'
    });
    expect(partsAustralia.find((p) => p.name === 'Flag_Field')?.color).toBe('#1e3a8a');
    expect(partsAustralia.find((p) => p.name === 'Flag_Commonwealth_Star')?.color).toBe('#f8fafc');
    expect(partsAustralia.find((p) => p.name === 'Flag_Star_Alpha')?.color).toBe('#f8fafc');
    expect(partsAustralia.find((p) => p.name === 'Flag_Star_Epsilon')?.color).toBe('#f8fafc');

    const partsAustraliaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'australia',
      flag_orientation: 'vertical'
    });
    expect(partsAustraliaRotated.find((p) => p.name === 'Flag_Field')?.color).toBe('#1e3a8a');
    expect(partsAustraliaRotated.find((p) => p.name === 'Flag_Commonwealth_Star')?.color).toBe(
      '#f8fafc'
    );

    // New Zealand (blue field, Union Jack canton, 4 red stars with white borders)
    const partsNZ = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'new_zealand',
      flag_orientation: 'standard'
    });
    expect(partsNZ.find((p) => p.name === 'Flag_Field')?.color).toBe('#1e3a8a');
    expect(partsNZ.find((p) => p.name === 'Flag_Star_Border_Alpha')?.color).toBe('#f8fafc');
    expect(partsNZ.find((p) => p.name === 'Flag_Star_Core_Alpha')?.color).toBe('#ef4444');

    const partsNZRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'new_zealand',
      flag_orientation: 'vertical'
    });
    expect(partsNZRotated.find((p) => p.name === 'Flag_Field')?.color).toBe('#1e3a8a');
    expect(partsNZRotated.find((p) => p.name === 'Flag_Star_Border_Alpha')?.color).toBe('#f8fafc');
    expect(partsNZRotated.find((p) => p.name === 'Flag_Star_Core_Alpha')?.color).toBe('#ef4444');

    // Greece (9 blue/white stripes, blue canton with centered white cross)
    const partsGreece = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'greece',
      flag_orientation: 'standard'
    });
    expect(partsGreece.find((p) => p.name === 'Flag_Canton_Blue')?.color).toBe('#1d4ed8');
    expect(partsGreece.find((p) => p.name === 'Flag_Canton_Cross')?.color).toBe('#f8fafc');
    expect(partsGreece.filter((p) => p.name.startsWith('Flag_Stripe_')).length).toBe(9);

    const partsGreeceRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'greece',
      flag_orientation: 'vertical'
    });
    expect(partsGreeceRotated.find((p) => p.name === 'Flag_Canton_Blue')?.color).toBe('#1d4ed8');
    expect(partsGreeceRotated.find((p) => p.name === 'Flag_Canton_Cross')?.color).toBe('#f8fafc');

    // Tonga (red field, white canton with centered red Greek cross)
    const partsTonga = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'tonga',
      flag_orientation: 'standard'
    });
    expect(partsTonga.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsTonga.find((p) => p.name === 'Flag_Canton_White')?.color).toBe('#f8fafc');
    expect(partsTonga.find((p) => p.name === 'Flag_Canton_Cross')?.color).toBe('#ef4444');

    const partsTongaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'tonga',
      flag_orientation: 'vertical'
    });
    expect(partsTongaRotated.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsTongaRotated.find((p) => p.name === 'Flag_Canton_White')?.color).toBe('#f8fafc');
    expect(partsTongaRotated.find((p) => p.name === 'Flag_Canton_Cross')?.color).toBe('#ef4444');

    // Switzerland (red field, centered white Greek cross)
    const partsSwiss = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'switzerland',
      flag_orientation: 'standard'
    });
    expect(partsSwiss.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsSwiss.find((p) => p.name === 'Flag_Cross_White')?.color).toBe('#f8fafc');

    const partsSwissRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'switzerland',
      flag_orientation: 'vertical'
    });
    expect(partsSwissRotated.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsSwissRotated.find((p) => p.name === 'Flag_Cross_White')?.color).toBe('#f8fafc');

    // North Macedonia (red field, golden 8-ray sun with central disc)
    const partsMacedonia = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'north_macedonia',
      flag_orientation: 'standard'
    });
    expect(partsMacedonia.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsMacedonia.find((p) => p.name === 'Flag_Sun')?.color).toBe('#eab308');

    const partsMacedoniaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'north_macedonia',
      flag_orientation: 'vertical'
    });
    expect(partsMacedoniaRotated.find((p) => p.name === 'Flag_Field')?.color).toBe('#ef4444');
    expect(partsMacedoniaRotated.find((p) => p.name === 'Flag_Sun')?.color).toBe('#eab308');

    // Seychelles (5 radiating oblique bands: blue, yellow, red, white, green)
    const partsSeychelles = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'seychelles',
      flag_orientation: 'standard'
    });
    expect(partsSeychelles.find((p) => p.name === 'Flag_Band_Blue')?.color).toBe('#0284c7');
    expect(partsSeychelles.find((p) => p.name === 'Flag_Band_Yellow')?.color).toBe('#eab308');
    expect(partsSeychelles.find((p) => p.name === 'Flag_Band_Red')?.color).toBe('#ef4444');
    expect(partsSeychelles.find((p) => p.name === 'Flag_Band_White')?.color).toBe('#f8fafc');
    expect(partsSeychelles.find((p) => p.name === 'Flag_Band_Green')?.color).toBe('#16a34a');

    const partsSeychellesRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'seychelles',
      flag_orientation: 'vertical'
    });
    expect(partsSeychellesRotated.find((p) => p.name === 'Flag_Band_Blue')?.color).toBe('#0284c7');
    expect(partsSeychellesRotated.find((p) => p.name === 'Flag_Band_Yellow')?.color).toBe(
      '#eab308'
    );
    expect(partsSeychellesRotated.find((p) => p.name === 'Flag_Band_Red')?.color).toBe('#ef4444');
    expect(partsSeychellesRotated.find((p) => p.name === 'Flag_Band_White')?.color).toBe('#f8fafc');
    expect(partsSeychellesRotated.find((p) => p.name === 'Flag_Band_Green')?.color).toBe('#16a34a');
  });

  it('generates United States flag correctly in horizontal and rotated modes', () => {
    const partsUS = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'united_states',
      flag_orientation: 'standard',
      flag_fillet: 0.2
    });
    const canton = partsUS.find((p) => p.name === 'Flag_Canton_Blue');
    const stars = partsUS.filter((p) => p.name.startsWith('Flag_Star'));
    console.log(
      'US Parts count:',
      partsUS.length,
      'Canton:',
      !!canton,
      'Stars count:',
      stars.length
    );
    expect(canton?.color).toBe('#1e3a8a');
    expect(stars.length).toBeGreaterThanOrEqual(35);
    expect(partsUS.find((p) => p.name === 'Flag_Stripe_1')?.color).toBe('#ef4444');
    expect(partsUS.find((p) => p.name === 'Flag_Stripe_2')?.color).toBe('#f8fafc');
    expect(partsUS.find((p) => p.name === 'Flag_Stripe_13')?.color).toBe('#ef4444');

    const partsUSRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'united_states',
      flag_orientation: 'vertical',
      flag_fillet: 0.2
    });
    const cantonRot = partsUSRotated.find((p) => p.name === 'Flag_Canton_Blue');
    const starsRot = partsUSRotated.filter((p) => p.name.startsWith('Flag_Star'));
    expect(cantonRot?.color).toBe('#1e3a8a');
    expect(starsRot.length).toBeGreaterThanOrEqual(35);
    expect(partsUSRotated.find((p) => p.name === 'Flag_Stripe_1')?.color).toBe('#ef4444');
    expect(partsUSRotated.find((p) => p.name === 'Flag_Stripe_2')?.color).toBe('#f8fafc');
    expect(partsUSRotated.find((p) => p.name === 'Flag_Stripe_13')?.color).toBe('#ef4444');

    // Also build single composite shape
    const shape = buildFlagsKeychain({
      ...defaultFlagsParameters,
      flag_type: 'united_states'
    });
    expect(shape).toBeDefined();
  });

  it('draws 11-pointed maple leaf correctly and generates Canada flag', () => {
    const leaf = drawMapleLeaf(10, [0, 0], 0);
    expect(leaf).toBeDefined();

    // Canada Standard orientation (Red Left, White Middle, Red Right + Maple Leaf)
    const partsCanada = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'canada',
      flag_orientation: 'standard',
      flag_fillet: 0.2
    });

    const left = partsCanada.find((p) => p.name === 'Flag_Left');
    const mid = partsCanada.find((p) => p.name === 'Flag_Middle');
    const right = partsCanada.find((p) => p.name === 'Flag_Right');
    const leafPart = partsCanada.find((p) => p.name === 'Flag_Maple_Leaf');

    expect(left?.color).toBe('#ef4444');
    expect(mid?.color).toBe('#f8fafc');
    expect(right?.color).toBe('#ef4444');
    expect(leafPart?.color).toBe('#ef4444');

    // Canada Rotated 90 deg (Red Top, White Middle, Red Bottom + Maple Leaf)
    const partsCanadaRotated = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'canada',
      flag_orientation: 'rotated',
      flag_fillet: 0.2
    });

    const top = partsCanadaRotated.find((p) => p.name === 'Flag_Top');
    const midRot = partsCanadaRotated.find((p) => p.name === 'Flag_Middle');
    const bot = partsCanadaRotated.find((p) => p.name === 'Flag_Bottom');
    const leafRot = partsCanadaRotated.find((p) => p.name === 'Flag_Maple_Leaf');

    expect(top?.color).toBe('#ef4444');
    expect(midRot?.color).toBe('#f8fafc');
    expect(bot?.color).toBe('#ef4444');
    expect(leafRot?.color).toBe('#ef4444');

    // Single composite shape check
    const compositeCanada = buildFlagsKeychain({
      ...defaultFlagsParameters,
      flag_type: 'canada'
    });
    expect(compositeCanada).toBeDefined();
  });

  it('allows registering custom flags dynamically into FLAG_REGISTRY', () => {
    registerFlag('custom_test_flag', {
      name: 'Custom Test (Purple / Cyan)',
      generate: createBicolorFlagGenerator('#a855f7', '#06b6d4', 'horizontal')
    });

    const parts = buildFlagsKeychainParts({
      ...defaultFlagsParameters,
      flag_type: 'custom_test_flag'
    });
    expect(parts.length).toBe(5);

    const topPart = parts.find((p) => p.name === 'Flag_Top');
    const bottomPart = parts.find((p) => p.name === 'Flag_Bottom');
    expect(topPart?.color).toBe('#a855f7');
    expect(bottomPart?.color).toBe('#06b6d4');
  });
});
