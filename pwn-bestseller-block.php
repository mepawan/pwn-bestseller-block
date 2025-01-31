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
