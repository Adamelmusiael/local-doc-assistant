"""
Configuration loader for reading application settings from .config file
"""
import os
from typing import List, Set


def load_config() -> dict:
    """Load configuration from .config file"""
    config = {}
    # Find project root by looking for .config file
    current_dir = os.path.dirname(__file__)
    project_root = current_dir
    
    # Go up directories until we find .config or reach filesystem root
    while project_root != os.path.dirname(project_root):
        config_path = os.path.join(project_root, '.config')
        if os.path.exists(config_path):
            break
        project_root = os.path.dirname(project_root)
    else:
        # If we didn't find .config, try the original approach
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.config')
    
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at {config_path}")
    
    with open(config_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    
    return config


def get_openai_models() -> Set[str]:
    """Get the set of OpenAI models from config"""
    config = load_config()
    models_str = config.get('OPENAI_MODELS', '')
    if models_str:
        return set(model.strip() for model in models_str.split(','))
    return set()


def get_allowed_models() -> List[str]:
    """Get the list of all allowed models from config"""
    config = load_config()
    models_str = config.get('ALLOWED_MODELS', '')
    if models_str:
        return [model.strip() for model in models_str.split(',')]
    return []


def get_default_model() -> str:
    """Get the default LLM model from config"""
    config = load_config()
    return config.get('DEFAULT_LLM_MODEL', 'mistral')


def get_confidentiality_options() -> List[str]:
    """Get the list of confidentiality options from config"""
    config = load_config()
    options_str = config.get('CONFIDENTIALITY_OPTIONS', '')
    if options_str:
        return [option.strip() for option in options_str.split(',')]
    return []
