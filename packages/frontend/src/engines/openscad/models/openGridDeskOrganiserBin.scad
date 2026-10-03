// OpenGrid Desk Organiser Bin
// Parametric bin sized by OpenGrid units (28mm) with evenly spaced OpenGrid Snap Lite connectors

grid_width = 2; // Width in OpenGrid units (each 28mm)
grid_depth = 2; // Depth in OpenGrid units (each 28mm)
height = 100; // Height of bin in mm
outer_walls = true; // Include outer perimeter walls (false = flat base with dividers only)
wall_thickness = 1.6; // Wall thickness in mm
bottom_thickness = 2.0; // Bottom floor thickness in mm
corner_chamfer = 4.2; // 45-degree outer corner chamfer in mm
inner_base_radius = 2.5; // Radius of rounded transition from inner base floor to walls in mm
tolerance = 0.5; // Grid clearance tolerance in mm
snap_type = "lite"; // Snap type: "lite" (Snap Lite, 3.4mm) or "normal" (Normal Snap, 6.8mm)
dividers_x = 0; // Number of vertical dividers along X (columns, 0 to 10)
divider_x_position_mode = "auto"; // "auto" (evenly spaced) or "custom" (explicit mm)
divider_x_1_pos = 0; // Position from left inner wall in mm (0 = at edge)
divider_x_2_pos = 0;
divider_x_3_pos = 0;
divider_x_4_pos = 0;
divider_x_5_pos = 0;
divider_x_6_pos = 0;
divider_x_7_pos = 0;
divider_x_8_pos = 0;
divider_x_9_pos = 0;
divider_x_10_pos = 0;

dividers_y = 0; // Number of horizontal dividers along Y (rows, 0 to 10)
divider_y_position_mode = "auto"; // "auto" (evenly spaced) or "custom" (explicit mm)
divider_y_1_pos = 0; // Position from front inner wall in mm (0 = at edge)
divider_y_2_pos = 0;
divider_y_3_pos = 0;
divider_y_4_pos = 0;
divider_y_5_pos = 0;
divider_y_6_pos = 0;
divider_y_7_pos = 0;
divider_y_8_pos = 0;
divider_y_9_pos = 0;
divider_y_10_pos = 0;

divider_thickness = 1.2; // Thickness of internal divider walls in mm

module openGridSnapLite () {
    $fn = 16;
    module cutout() {
        union() {
            translate([0, 11.4, 1.4])
                cube([11.8, 0.6, 2.8], true);
            translate([-5.9, 11.4, 1.4])
                cylinder(2.8, 0.3, 0.3, true);
            translate([5.9, 11.4, 1.4])
                cylinder(2.8, 0.3, 0.3, true);
            translate([0, 12, 2.4])
                cube([12, 0.8, 0.4], true);
        }
    }
    
    module corner() {
        translate([0, 0, 1.9])
            polyhedron(
                [
                    [-3.406, 0, 0],
                    [-2.306, 1.1, 1.1],
                    [2.306, 1.1, 1.1],
                    [3.406, 0, 0],
                    [-3.406, 0, 1.5],
                    [-2.306, 1.1, 1.5],
                    [2.306, 1.1, 1.5],
                    [3.406, 0, 1.5]
                ], 
                [
                    [0,1,2,3],
                    [4,5,1,0],
                    [7,6,5,4],
                    [5,6,2,1],
                    [6,7,3,2],
                    [7,4,0,3]
                ]
            );
    }
    
    module snap() {
        translate([0, 12.4, 0.2])
            polyhedron(
                [
                    [-5.4, 0, 0],
                    [-3.4342, 0.4, 0.4715],
                    [3.4342, 0.4, 0.4715],
                    [5.4, 0, 0],
                    [-5.4, 0, 1.8],
                    [-3.4342, 0.4, 1.4145],
                    [3.4342, 0.4, 1.4145],
                    [5.4, 0, 1.8]
                ], 
                [
                    [0,1,2,3],
                    [4,5,1,0],
                    [7,6,5,4],
                    [5,6,2,1],
                    [6,7,3,2],
                    [7,4,0,3]
                ]
            );
    }
    
    union() {
        difference() {
            linear_extrude(3.4) {
                polygon(
                    [
                        [-7.582, -12.4],
                        [7.582, -12.4],
                        [12.4, -7.582],
                        [12.4, 7.582],
                        [7.582, 12.4],
                        [-7.582, 12.4],
                        [-12.4, 7.582],
                        [-12.4, -7.582]
                    ]
                );
            }
            
            cutout();
            rotate([0, 0, 90]) cutout();
            rotate([0, 0, 180]) cutout();
            rotate([0, 0, -90]) cutout();
        }
        
        translate([-9.991, 9.991, 0]) rotate([0, 0, 45]) corner();
        translate([-9.991, -9.991, 0]) rotate([0, 0, 135]) corner();
        translate([9.991, 9.991, 0]) rotate([0, 0, -45]) corner();
        translate([9.991, -9.991, 0]) rotate([0, 0, -135]) corner();
        
        snap();
        rotate([0, 0, 90]) snap();
        rotate([0, 0, 180]) snap();
        rotate([0, 0, -90]) snap();
    }
}

module openGridSnap () {
    $fn = 16;
    module cutout() {
        union() {
            translate([0, 11.4, 3.1])
                cube([11.8, 0.6, 6.2], true);
            translate([-5.9, 11.4, 3.1])
                cylinder(6.2, 0.3, 0.3, true);
            translate([5.9, 11.4, 3.1])
                cylinder(6.2, 0.3, 0.3, true);
            translate([0, 12, 5.8])
                cube([12, 0.8, 0.4], true);
        }
    }
    
    module corner() {
        translate([0, 0, 5.3])
            polyhedron(
                [
                    [-3.406, 0, 0],
                    [-2.306, 1.1, 1.1],
                    [2.306, 1.1, 1.1],
                    [3.406, 0, 0],
                    [-3.406, 0, 1.5],
                    [-2.306, 1.1, 1.5],
                    [2.306, 1.1, 1.5],
                    [3.406, 0, 1.5]
                ], 
                [
                    [0,1,2,3],
                    [4,5,1,0],
                    [7,6,5,4],
                    [5,6,2,1],
                    [6,7,3,2],
                    [7,4,0,3]
                ]
            );
    }
    
    module snap() {
        translate([0, 12.4, 3.4])
            polyhedron(
                [
                    [-5.4, 0, 0],
                    [-3.4342, 0.4, 0.5715],
                    [3.4342, 0.4, 0.5715],
                    [5.4, 0, 0],
                    [-5.4, 0, 2],
                    [-3.4342, 0.4, 1.7145],
                    [3.4342, 0.4, 1.7145],
                    [5.4, 0, 2]
                ], 
                [
                    [0,1,2,3],
                    [4,5,1,0],
                    [7,6,5,4],
                    [5,6,2,1],
                    [6,7,3,2],
                    [7,4,0,3]
                ]
            );
    }
    
    union() {
        difference() {
            linear_extrude(6.8) {
                polygon(
                    [
                        [-7.582, -12.4],
                        [7.582, -12.4],
                        [12.4, -7.582],
                        [12.4, 7.582],
                        [7.582, 12.4],
                        [-7.582, 12.4],
                        [-12.4, 7.582],
                        [-12.4, -7.582]
                    ]
                );
            }
            
            cutout();
            rotate([0, 0, 90]) cutout();
            rotate([0, 0, 180]) cutout();
            rotate([0, 0, -90]) cutout();
        }
        
        translate([-9.991, 9.991, 0]) rotate([0, 0, 45]) corner();
        translate([-9.991, -9.991, 0]) rotate([0, 0, 135]) corner();
        translate([9.991, 9.991, 0]) rotate([0, 0, -45]) corner();
        translate([9.991, -9.991, 0]) rotate([0, 0, -135]) corner();
        
        snap();
        rotate([0, 0, 90]) snap();
        rotate([0, 0, 180]) snap();
        rotate([0, 0, -90]) snap();
    }
}

outer_w = (grid_width * 28) - tolerance;
outer_d = (grid_depth * 28) - tolerance;
inner_w = outer_w - (wall_thickness * 2);
inner_d = outer_d - (wall_thickness * 2);
// 45-degree offset for uniform wall thickness along chamfered corners:
inner_c = max(0, corner_chamfer - (wall_thickness * (sqrt(2) - 1)));

module chamfered_rect_2d(w, d, c) {
    eff_c = min(c, min(w, d) / 2);
    if (eff_c <= 0) {
        square([w, d], center = true);
    } else {
        polygon(points = [
            [-w/2 + eff_c, -d/2],
            [ w/2 - eff_c, -d/2],
            [ w/2,         -d/2 + eff_c],
            [ w/2,          d/2 - eff_c],
            [ w/2 - eff_c,  d/2],
            [-w/2 + eff_c,  d/2],
            [-w/2,          d/2 - eff_c],
            [-w/2,         -d/2 + eff_c]
        ]);
    }
}

module bin_outer() {
    linear_extrude(height)
        chamfered_rect_2d(outer_w, outer_d, corner_chamfer);
}

function get_custom_divider_x(idx, inner_w) =
    (idx == 1) ? min(max(0, divider_x_1_pos), inner_w) :
    (idx == 2) ? min(max(0, divider_x_2_pos), inner_w) :
    (idx == 3) ? min(max(0, divider_x_3_pos), inner_w) :
    (idx == 4) ? min(max(0, divider_x_4_pos), inner_w) :
    (idx == 5) ? min(max(0, divider_x_5_pos), inner_w) :
    (idx == 6) ? min(max(0, divider_x_6_pos), inner_w) :
    (idx == 7) ? min(max(0, divider_x_7_pos), inner_w) :
    (idx == 8) ? min(max(0, divider_x_8_pos), inner_w) :
    (idx == 9) ? min(max(0, divider_x_9_pos), inner_w) :
    (idx == 10) ? min(max(0, divider_x_10_pos), inner_w) :
    (inner_w / 2);

function get_custom_divider_y(idx, inner_d) =
    (idx == 1) ? min(max(0, divider_y_1_pos), inner_d) :
    (idx == 2) ? min(max(0, divider_y_2_pos), inner_d) :
    (idx == 3) ? min(max(0, divider_y_3_pos), inner_d) :
    (idx == 4) ? min(max(0, divider_y_4_pos), inner_d) :
    (idx == 5) ? min(max(0, divider_y_5_pos), inner_d) :
    (idx == 6) ? min(max(0, divider_y_6_pos), inner_d) :
    (idx == 7) ? min(max(0, divider_y_7_pos), inner_d) :
    (idx == 8) ? min(max(0, divider_y_8_pos), inner_d) :
    (idx == 9) ? min(max(0, divider_y_9_pos), inner_d) :
    (idx == 10) ? min(max(0, divider_y_10_pos), inner_d) :
    (inner_d / 2);

function is_x_custom() = (divider_x_position_mode == "custom");

function is_y_custom() = (divider_y_position_mode == "custom");

function get_divider_x_pos(idx, count, inner_w) =
    is_x_custom()
        ? get_custom_divider_x(idx, inner_w)
        : (idx * inner_w / (count + 1));

function get_divider_y_pos(idx, count, inner_d) =
    is_y_custom()
        ? get_custom_divider_y(idx, inner_d)
        : (idx * inner_d / (count + 1));

function get_min_compartment_w() =
    (dividers_x <= 0) ? inner_w :
    let (
        raw = concat(
            [ get_divider_x_pos(1, dividers_x, inner_w) - divider_thickness / 2 ],
            [ for (i = [1 : max(1, dividers_x - 1)])
                (dividers_x > 1) ? (get_divider_x_pos(i + 1, dividers_x, inner_w) - get_divider_x_pos(i, dividers_x, inner_w) - divider_thickness) : inner_w ],
            [ inner_w - get_divider_x_pos(dividers_x, dividers_x, inner_w) - divider_thickness / 2 ]
        ),
        valid = [ for (w = raw) if (w > 0.5) w ]
    )
    len(valid) > 0 ? min(valid) : inner_w;

function get_min_compartment_d() =
    (dividers_y <= 0) ? inner_d :
    let (
        raw = concat(
            [ get_divider_y_pos(1, dividers_y, inner_d) - divider_thickness / 2 ],
            [ for (j = [1 : max(1, dividers_y - 1)])
                (dividers_y > 1) ? (get_divider_y_pos(j + 1, dividers_y, inner_d) - get_divider_y_pos(j, dividers_y, inner_d) - divider_thickness) : inner_d ],
            [ inner_d - get_divider_y_pos(dividers_y, dividers_y, inner_d) - divider_thickness / 2 ]
        ),
        valid = [ for (d = raw) if (d > 0.5) d ]
    )
    len(valid) > 0 ? min(valid) : inner_d;

module compartments_2d() {
    difference() {
        chamfered_rect_2d(inner_w, inner_d, inner_c);

        if (dividers_x > 0 && inner_w > 10) {
            for (i = [1 : dividers_x]) {
                x_offset = get_divider_x_pos(i, dividers_x, inner_w);
                x_pos = (-inner_w / 2) + x_offset;
                translate([x_pos, 0])
                    square([divider_thickness, inner_d + 10], center = true);
            }
        }
        if (dividers_y > 0 && inner_d > 10) {
            for (j = [1 : dividers_y]) {
                y_offset = get_divider_y_pos(j, dividers_y, inner_d);
                y_pos = (-inner_d / 2) + y_offset;
                translate([0, y_pos])
                    square([inner_w + 10, divider_thickness], center = true);
            }
        }
    }
}

module bin_cavity() {
    min_cell = min(get_min_compartment_w(), get_min_compartment_d());
    r = (inner_base_radius > 0 && min_cell > 1)
        ? min(inner_base_radius, min((min_cell / 2) - 0.2, height - bottom_thickness - 1))
        : 0;

    if (r <= 0) {
        translate([0, 0, bottom_thickness])
            linear_extrude(height - bottom_thickness + 1)
                compartments_2d();
    } else {
        cavity_h = height - bottom_thickness + 2;

        translate([0, 0, bottom_thickness + r])
            minkowski() {
                linear_extrude(cavity_h)
                    offset(delta = -r)
                        compartments_2d();
                sphere(r, $fn = 16);
            }
    }
}

module bottom_snaps() {
    for (i = [0 : grid_width - 1]) {
        for (j = [0 : grid_depth - 1]) {
            snap_x = (i - (grid_width - 1) / 2) * 28;
            snap_y = (j - (grid_depth - 1) / 2) * 28;
            if (snap_type == "normal") {
                translate([snap_x, snap_y, -6.8 + 0.02])
                    openGridSnap();
            } else {
                translate([snap_x, snap_y, -3.4 + 0.02])
                    openGridSnapLite();
            }
        }
    }
}

function divider_profile_points(t, h, r, steps = 16) =
    (r <= 0) ? [
        [-t/2, 0],
        [ t/2, 0],
        [ t/2, h],
        [-t/2, h]
    ] : concat(
        [ for (i = [0 : steps])
            let (a = i * 90 / steps)
            [ t/2 + r * (1 - sin(a)), r * (1 - cos(a)) ]
        ],
        [ [t/2, h] ],
        [ [-t/2, h] ],
        [ for (i = [0 : steps])
            let (a = (steps - i) * 90 / steps)
            [ -(t/2 + r * (1 - sin(a))), r * (1 - cos(a)) ]
        ]
    );

module divider_wall_x(t, length, h, r) {
    rotate([90, 0, 0])
        linear_extrude(length, center = true)
            polygon(divider_profile_points(t, h, r));
}

module divider_wall_y(t, length, h, r) {
    rotate([0, 0, 90])
        divider_wall_x(t, length, h, r);
}

module open_dividers() {
    cavity_h = height - bottom_thickness;
    r = (inner_base_radius > 0)
        ? min(inner_base_radius, min(cavity_h - 1, min(outer_w / 2 - 1, outer_d / 2 - 1)))
        : 0;

    if (dividers_x > 0) {
        for (i = [1 : dividers_x]) {
            x_offset = get_divider_x_pos(i, dividers_x, outer_w);
            x_pos = (-outer_w / 2) + x_offset;
            translate([x_pos, 0, bottom_thickness])
                divider_wall_x(divider_thickness, outer_d + 10, cavity_h, r);
        }
    }
    if (dividers_y > 0) {
        for (j = [1 : dividers_y]) {
            y_offset = get_divider_y_pos(j, dividers_y, outer_d);
            y_pos = (-outer_d / 2) + y_offset;
            translate([0, y_pos, bottom_thickness])
                divider_wall_y(divider_thickness, outer_w + 10, cavity_h, r);
        }
    }
}

union() {
    if (outer_walls) {
        difference() {
            bin_outer();
            bin_cavity();
        }
    } else {
        linear_extrude(bottom_thickness)
            chamfered_rect_2d(outer_w, outer_d, corner_chamfer);

        intersection() {
            linear_extrude(height)
                chamfered_rect_2d(outer_w, outer_d, corner_chamfer);
            open_dividers();
        }
    }
    bottom_snaps();
}
