<?php

/**
 * Plugin Name: PWN Bestseller Block
 * Description: Display bestselling books by genre using the Biblio API
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) {
    exit;
}

// Register block
function pwn_bestseller_block_init() {
    // Make sure all dependencies are available
    if (!function_exists('register_block_type')) {
        return;
    }

    // Register our block script
    pwn_register_script(
        'pwn-bestseller-block-editor',
        plugins_url('build/index.js', __FILE__),
        array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n')
    );

    // Register our block styles
    wp_register_style(
        'pwn-bestseller-block-style',
        plugins_url('build/style.css', __FILE__),
        array()
    );

    // Register the block
    register_block_type('pwn-bestseller/bestseller-block', array(
        'editor_script' => 'pwn-bestseller-block-editor',
        'editor_style' => 'pwn-bestseller-block-style',
        'style' => 'pwn-bestseller-block-style',
    ));
}
add_action('init', 'pwn_bestseller_block_init');




// Add API endpoint for genre fetching
function pwn_register_genre_route() {
    register_rest_route('pwn/v1', '/genres', array(
        'methods' => 'GET',
        'callback' => 'pwn_get_genres',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('pwn/v1', '/bestseller', array(
        'methods' => 'GET',
        'callback' => 'pwn_get_bestseller',
        'permission_callback' => '__return_true'
    ));
}
add_action('rest_api_init', 'pwn_register_genre_route');

function pwn_get_genres() {
    $api_key = '7fqge2qgxcdrwqbcgeywwdj2';
    $response = wp_remote_get(
        'https://api.penguinrandomhouse.com/resources/v2/title/domains/PRH.UK/categories?rows=15&catSetId=PW&api_key=' . $api_key
    );
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch genres', array('status' => 500));
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return rest_ensure_response($body);
}

function pwn_get_bestseller($request) {
    $api_key = '7fqge2qgxcdrwqbcgeywwdj2';
    $genre_id = $request->get_param('genreId');
    
    $response = wp_remote_get(
        'https://api.penguinrandomhouse.com/resources/v2/title/domains/PRH.UK/works/views/uk-list-display?' .
        'rows=1&catUri=' . $genre_id . '&catSetId=PW&sort=weeklySales&dir=desc&api_key=' . $api_key
    );
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch bestseller', array('status' => 500));
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return rest_ensure_response($body);
}
