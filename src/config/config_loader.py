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


def get_local_models() -> List[str]:
    """
    Get list of all local models that can access confidential data.
    
    Returns:
        List[str]: List of local model names from config
    """
    config = load_config()
    models_str = config.get('LOCAL_MODELS', '')
    if models_str:
        return [model.strip() for model in models_str.split(',')]
    return []


def get_external_models() -> List[str]:
    """
    Get list of all external models that cannot access confidential data.
    
    Returns:
        List[str]: List of external model names from config
    """
    config = load_config()
    models_str = config.get('EXTERNAL_MODELS', '')
    if models_str:
        return [model.strip() for model in models_str.split(',')]
    return []


def is_local_model(model_name: str) -> bool:
    """
    Determine if a model is local (can access confidential data) or external.
    
    Args:
        model_name (str): The name of the model to check
        
    Returns:
        bool: True if model is local and can access confidential data, False if external
    """
    if not model_name:
        return False
    
    # Check if model is in the local models list
    local_models = get_local_models()
    if model_name.lower() in {m.lower() for m in local_models}:
        return True
    
    # Check if model is in the external models list
    external_models = get_external_models()
    if model_name.lower() in {m.lower() for m in external_models}:
        return False
    
    # If model is not in either list, default to local for safety
    # (assuming unknown models are local/internal)
    return True
