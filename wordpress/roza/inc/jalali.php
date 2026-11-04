<?php
/**
 * تبدیل تاریخ میلادی ↔ جلالی (الگوریتم jalaali-js، مجوز MIT).
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

function roza_jdiv( $a, $b ) {
	return intdiv( $a, $b );
}
function roza_jmod( $a, $b ) {
	return $a - intdiv( $a, $b ) * $b;
}
function roza_jal_cal( $jy, $without_leap = false ) {
	$breaks = array( -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178 );
	$bl     = count( $breaks );
	$gy     = $jy + 621;
	$leap_j = -14;
	$jp     = $breaks[0];
	$jump   = 0;
	for ( $i = 1; $i < $bl; $i++ ) {
		$jm   = $breaks[ $i ];
		$jump = $jm - $jp;
		if ( $jy < $jm ) {
			break;
		}
		$leap_j += roza_jdiv( $jump, 33 ) * 8 + roza_jdiv( roza_jmod( $jump, 33 ), 4 );
		$jp      = $jm;
	}
	$n       = $jy - $jp;
	$leap_j += roza_jdiv( $n, 33 ) * 8 + roza_jdiv( roza_jmod( $n, 33 ) + 3, 4 );
	if ( 4 === roza_jmod( $jump, 33 ) && 4 === $jump - $n ) {
		$leap_j++;
	}
	$leap_g = roza_jdiv( $gy, 4 ) - roza_jdiv( ( roza_jdiv( $gy, 100 ) + 1 ) * 3, 4 ) - 150;
	$march  = 20 + $leap_j - $leap_g;
	if ( $without_leap ) {
		return array( 'gy' => $gy, 'march' => $march );
	}
	if ( $jump - $n < 6 ) {
		$n = $n - $jump + roza_jdiv( $jump + 4, 33 ) * 33;
	}
	$leap = roza_jmod( roza_jmod( $n + 1, 33 ) - 1, 4 );
	if ( -1 === $leap ) {
		$leap = 4;
	}
	return array( 'leap' => $leap, 'gy' => $gy, 'march' => $march );
}
function roza_g2d( $gy, $gm, $gd ) {
	$d = roza_jdiv( ( $gy + roza_jdiv( $gm - 8, 6 ) + 100100 ) * 1461, 4 ) + roza_jdiv( 153 * roza_jmod( $gm + 9, 12 ) + 2, 5 ) + $gd - 34840408;
	return $d - roza_jdiv( roza_jdiv( $gy + 100100 + roza_jdiv( $gm - 8, 6 ), 100 ) * 3, 4 ) + 752;
}
function roza_d2g( $jdn ) {
	$j  = 4 * $jdn + 139361631;
	$j  = $j + roza_jdiv( roza_jdiv( 4 * $jdn + 183187720, 146097 ) * 3, 4 ) * 4 - 3908;
	$i  = roza_jdiv( roza_jmod( $j, 1461 ), 4 ) * 5 + 308;
	$gd = roza_jdiv( roza_jmod( $i, 153 ), 5 ) + 1;
	$gm = roza_jmod( roza_jdiv( $i, 153 ), 12 ) + 1;
	$gy = roza_jdiv( $j, 1461 ) - 100100 + roza_jdiv( 8 - $gm, 6 );
	return array( $gy, $gm, $gd );
}
function roza_d2j( $jdn ) {
	$gy = roza_d2g( $jdn )[0];
	$jy = $gy - 621;
	$r  = roza_jal_cal( $jy );
	$k  = $jdn - roza_g2d( $gy, 3, $r['march'] );
	if ( $k >= 0 ) {
		if ( $k <= 185 ) {
			return array( $jy, 1 + roza_jdiv( $k, 31 ), roza_jmod( $k, 31 ) + 1 );
		}
		$k -= 186;
	} else {
		$jy--;
		$k += 179;
		if ( 1 === $r['leap'] ) {
			$k++;
		}
	}
	return array( $jy, 7 + roza_jdiv( $k, 30 ), roza_jmod( $k, 30 ) + 1 );
}

/** [سال، ماه، روز] جلالی از Y-n-j میلادی */
function roza_to_jalali( $y, $m, $d ) {
	return roza_d2j( roza_g2d( (int) $y, (int) $m, (int) $d ) );
}

function roza_jalali_months() {
	return array( 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند' );
}
function roza_jalali_weekdays() {
	return array( 'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه' );
}

/** 0=شنبه … 6=جمعه از کلید Y-n-j */
function roza_weekday( $date_key ) {
	$t = strtotime( $date_key . ' 12:00:00 UTC' );
	return ( (int) gmdate( 'w', $t ) + 1 ) % 7;
}

/** «چهارشنبه ۲۰ آبان ۱۴۰۵» از کلید Y-n-j */
function roza_long_date( $date_key ) {
	$p = array_map( 'intval', explode( '-', $date_key ) );
	if ( count( $p ) !== 3 ) {
		return '';
	}
	list( $jy, $jm, $jd ) = roza_to_jalali( $p[0], $p[1], $p[2] );
	return roza_jalali_weekdays()[ roza_weekday( $date_key ) ] . ' ' . roza_fa( $jd ) . ' ' . roza_jalali_months()[ $jm - 1 ] . ' ' . roza_fa( $jy );
}
