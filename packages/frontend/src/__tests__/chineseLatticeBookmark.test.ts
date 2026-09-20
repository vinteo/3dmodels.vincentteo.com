import { describe, it, expect, beforeAll } from 'vitest';
import {
  chineseLatticeBookmarkModel,
  chineseLatticeBookmarkParameters,
  calculateChineseLatticeBookmarkDimensions,
  calculateChineseLatticeBookmarkDynamicConstraints,
  buildChineseLatticeBookmarkParts,
  getZhouzhuangBlockSegments,
  getGridFretCellSegments,
  getPeanoCurveSegments,
  getCrossFretSegments,
  getGouLianHuiWenSegments,
  getBaJiaoJinSegments,
  getYaZiWenSegments,
  getDengLongJinSegments,
  getShuTiaoWenSegments,
  getHaiTangJinSegments,
  getFengCheWenSegments,
  getFangShengWenSegments,
  getShuangQianWenSegments
} from '../engines/replicad/models/chineseLatticeBookmark';
import { extractDefaultParameters } from '../engines/replicad/types';
import { ensureReplicadReady } from '../engines/replicad/occt';

describe('Chinese Lattice Bookmark Model & Algorithms', () => {
  beforeAll(async () => {
    await ensureReplicadReady();
  });

  describe('Algorithmic Pattern Segment Generators', () => {
    it('generates Zhouzhuang Wan-zi meander block segments', () => {
      const segments = getZhouzhuangBlockSegments();
      expect(segments.length).toBeGreaterThan(20);

      // Verify segments are bounded within 7x7 block coordinates [-3.5, 3.5]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(3.51);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(3.51);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(3.51);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(3.51);
      }
    });

    it('generates Stepped Fret Grid segments for both even and odd parity cells', () => {
      const evenSegs = getGridFretCellSegments(true);
      const oddSegs = getGridFretCellSegments(false);

      expect(evenSegs.length).toBeGreaterThan(10);
      expect(oddSegs.length).toBeGreaterThan(10);
      expect(evenSegs.length).toBe(oddSegs.length);

      // Verify bounds are within 6x4 cell coordinates [-3, 3] x [-2, 2]
      for (const [p1, p2] of evenSegs) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(2.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(2.01);
      }
    });

    it('generates generation-2 Peano Curve fractal meander segments', () => {
      const segments = getPeanoCurveSegments();
      // Peano curve generation 2 produces 81 curve steps + 4 frame lines
      expect(segments.length).toBe(81 + 4);
    });

    it('generates Shi-Zi Jin interlocking cross fret segments', () => {
      const segments = getCrossFretSegments();
      expect(segments.length).toBe(24);
      // Verify bounded within 6x6 cell [-3, 3]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(3.01);
      }
    });

    it('generates Si-Fang Gou-Lian Hui-Wen interlocking key meander segments', () => {
      const segments = getGouLianHuiWenSegments();
      expect(segments.length).toBe(22);
      // Verify bounded within 6x6 cell [-3, 3]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(3.01);
      }
    });

    it('generates Ba-Jiao Jin octagonal and square fret segments', () => {
      const segments = getBaJiaoJinSegments();
      expect(segments.length).toBe(28);
      // Verify bounded within 8x8 cell [-4, 4]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(4.01);
      }
    });

    it('generates Ya-Zi Wen ancient character Ya fret segments', () => {
      const segments = getYaZiWenSegments();
      expect(segments.length).toBe(36);
      // Verify bounded within 8x8 cell [-4, 4]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(4.01);
      }
    });

    it('generates Deng-Long Jin lantern fret segments', () => {
      const segments = getDengLongJinSegments();
      expect(segments.length).toBe(36);
      // Verify bounded within 8x8 cell [-4, 4]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(4.01);
      }
    });

    it('generates Shu-Tiao Wen scholar book ribbon fret segments', () => {
      const segments = getShuTiaoWenSegments();
      expect(segments.length).toBe(14);
      // Verify bounded within 6x6 cell [-3, 3]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(3.01);
      }
    });

    it('generates Hai-Tang Jin begonia blossom fret segments', () => {
      const segments = getHaiTangJinSegments();
      expect(segments.length).toBe(40);
      // Verify bounded within 8x8 cell [-4, 4]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(4.01);
      }
    });

    it('generates Feng-Che Wen windmill pinwheel fret segments', () => {
      const segments = getFengCheWenSegments();
      expect(segments.length).toBe(32);
      // Verify bounded within 6x6 cell [-3, 3]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(3.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(3.01);
      }
    });

    it('generates Fang-Sheng Wen interlocking lozenge fret segments', () => {
      const segments = getFangShengWenSegments();
      expect(segments.length).toBe(42);
      // Verify bounded within 8x8 cell [-4, 4]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(4.01);
      }
    });

    it('generates Shuang-Qian Wen interlocking double cash fret segments', () => {
      const segments = getShuangQianWenSegments();
      expect(segments.length).toBe(40);
      // Verify bounded within 8x8 cell [-4, 4]
      for (const [p1, p2] of segments) {
        expect(Math.abs(p1[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p1[1])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[0])).toBeLessThanOrEqual(4.01);
        expect(Math.abs(p2[1])).toBeLessThanOrEqual(4.01);
      }
    });
  });

  describe('Model Metadata & Schema', () => {
    it('has valid model definition, tags, sources, and AI disclosure', () => {
      expect(chineseLatticeBookmarkModel.id).toBe('chinese-lattice-bookmark');
      expect(chineseLatticeBookmarkModel.name).toBe('Chinese Lattice Bookmark');
      expect(chineseLatticeBookmarkModel.project).toBe('Bookmarks');
      expect(chineseLatticeBookmarkModel.tags).toContain('Chinese Lattice');
      expect(chineseLatticeBookmarkModel.tags).toContain('Bookmark');

      // AI disclosure matching flags-keychain
      expect(chineseLatticeBookmarkModel.aiDisclosure?.modelingAiAssisted).toBe(true);
      expect(chineseLatticeBookmarkModel.aiDisclosure?.modelNotice).toContain(
        'The 3D model generation code, parametric geometry definitions, and CAD algorithms'
      );

      // Sources referencing the eJMT paper and Daniel Sheets Dye's catalog
      expect(chineseLatticeBookmarkModel.sources).toBeDefined();
      expect(chineseLatticeBookmarkModel.sources?.length).toBe(2);
      expect(chineseLatticeBookmarkModel.sources?.[0].url).toBe(
        'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf'
      );
      expect(chineseLatticeBookmarkModel.sources?.[1].title).toBe('Chinese Lattice Designs');
    });

    it('extracts correct default parameters and pattern options', () => {
      const defaults = extractDefaultParameters(chineseLatticeBookmarkParameters);
      expect(defaults.width).toBe(50);
      expect(defaults.height).toBe(150);
      expect(defaults.depth).toBe(0.6);
      expect(defaults.pattern).toBe('zhouzhuang');
      expect(defaults.cell_size).toBe(20);
      expect(defaults.strut_thickness).toBe(1.2);
      expect(defaults.single_part).toBe(false);

      const patternParam = chineseLatticeBookmarkParameters.find((p) => p.id === 'pattern');
      const patternValues =
        patternParam?.type === 'enum' && patternParam.options
          ? patternParam.options.map((o) => o.value)
          : [];
      expect(patternValues).toEqual([
        'zhouzhuang',
        'grid_fret',
        'peano',
        'cross_fret',
        'gou_lian',
        'ba_jiao',
        'ya_zi',
        'deng_long',
        'shu_tiao',
        'hai_tang',
        'feng_che',
        'fang_sheng',
        'shuang_qian'
      ]);

      // Verify Chinese character names are present in labels
      const patternLabels =
        patternParam?.type === 'enum' && patternParam.options
          ? patternParam.options.map((o) => o.label)
          : [];
      expect(patternLabels.some((l) => l.includes('周庄万字纹'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('步步锦'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('皮亚诺曲折纹'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('十字锦'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('四方勾连回纹'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('八角锦'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('亚字纹'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('灯笼锦'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('书条纹'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('海棠锦'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('风车纹'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('方胜纹'))).toBe(true);
      expect(patternLabels.some((l) => l.includes('双钱纹'))).toBe(true);
    });

    it('calculates accurate overall dimensions', () => {
      const dims = calculateChineseLatticeBookmarkDimensions({
        width: 45,
        height: 140,
        depth: 0.8
      });
      expect(dims.find((d) => d.id === 'width')?.value).toBe(45);
      expect(dims.find((d) => d.id === 'height')?.value).toBe(140);
      expect(dims.find((d) => d.id === 'depth')?.value).toBe(0.8);
      expect(dims.find((d) => d.id === 'width')?.formatted).toBe('45.0 mm');
    });

    it('calculates dynamic constraints for text size and Y-position', () => {
      const constraints = calculateChineseLatticeBookmarkDynamicConstraints({
        height: 140,
        frame_thickness: 3,
        bar_1_thickness: 20,
        bar_2_thickness: 10,
        bar_3_thickness: 15
      });

      // bar 1: max text size should be thickness - 2 = 18
      expect(constraints['bar_1_text_size']?.max).toBe(18);
      // maxY = (140 - 2*3 - 20) / 2 = 114 / 2 = 57
      expect(constraints['bar_1_y_pos']?.max).toBe(57);
      expect(constraints['bar_1_y_pos']?.min).toBe(-57);

      // bar 2: max text size should be thickness - 2 = 8
      expect(constraints['bar_2_text_size']?.max).toBe(8);
      // maxY = (140 - 2*3 - 10) / 2 = 124 / 2 = 62
      expect(constraints['bar_2_y_pos']?.max).toBe(62);
      expect(constraints['bar_2_y_pos']?.min).toBe(-62);
    });
  });

  describe('3D Geometry Part Generation', () => {
    it('generates single fused part for Zhouzhuang pattern with default parameters', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'zhouzhuang',
        cell_size: 20,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Stepped Fret Grid pattern in dual-part mode', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'grid_fret',
        cell_size: 20,
        single_part: false,
        fuse_all_parts: false
      });

      expect(parts.length).toBe(2);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Frame');
      expect(parts[1].name).toBe('Chinese_Lattice_Bookmark_Pattern');
    });

    it('generates parts for Peano Curve fractal pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'peano',
        cell_size: 25,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Shi-Zi Jin interlocking cross fret pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'cross_fret',
        cell_size: 18,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Si-Fang Gou-Lian Hui-Wen pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'gou_lian',
        cell_size: 18,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Ba-Jiao Jin octagonal pattern in dual-part mode', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'ba_jiao',
        cell_size: 20,
        single_part: false,
        fuse_all_parts: false
      });

      expect(parts.length).toBe(2);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Frame');
      expect(parts[1].name).toBe('Chinese_Lattice_Bookmark_Pattern');
      expect(parts[0].shape).toBeDefined();
      expect(parts[1].shape).toBeDefined();
    });

    it('generates parts for Ya-Zi Wen ancient cruciform pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'ya_zi',
        cell_size: 20,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Deng-Long Jin lantern fret pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'deng_long',
        cell_size: 20,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Shu-Tiao Wen scholar ribbon fret pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'shu_tiao',
        cell_size: 18,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Hai-Tang Jin begonia blossom pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'hai_tang',
        cell_size: 20,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Feng-Che Wen windmill pinwheel pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'feng_che',
        cell_size: 18,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Fang-Sheng Wen interlocking lozenge pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'fang_sheng',
        cell_size: 20,
        single_part: true,
        fuse_all_parts: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Fused');
      expect(parts[0].shape).toBeDefined();
    });

    it('generates parts for Shuang-Qian Wen interlocking double cash pattern', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 60,
        depth: 0.6,
        pattern: 'shuang_qian',
        cell_size: 20,
        single_part: false,
        fuse_all_parts: false
      });

      expect(parts.length).toBe(2);
      expect(parts[0].name).toBe('Chinese_Lattice_Bookmark_Frame');
      expect(parts[1].name).toBe('Chinese_Lattice_Bookmark_Pattern');
      expect(parts[0].shape).toBeDefined();
      expect(parts[1].shape).toBeDefined();
    });

    it('integrates text cutout bars seamlessly into the bookmark', () => {
      const parts = buildChineseLatticeBookmarkParts({
        width: 40,
        height: 80,
        depth: 0.6,
        pattern: 'zhouzhuang',
        enable_bar_1: true,
        bar_1_text: 'TEST',
        bar_1_thickness: 15,
        bar_1_y_pos: 0,
        bar_1_text_size: 8,
        single_part: true
      });

      expect(parts.length).toBe(1);
      expect(parts[0].shape).toBeDefined();
    });
  });
});
